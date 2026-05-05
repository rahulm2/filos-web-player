"use client";

import { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";

// Initialize PostHog once
let initialized = false;
function ensurePostHogInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true; // mark early to prevent re-entry
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) {
    console.warn("[Analytics] No NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN — events will be no-ops");
    return;
  }
  // Clear stale PostHog config that may have cached old /ingest api_host
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("ph_") && key.includes("posthog")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage may not be available
  }

  posthog.init(token, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "memory",
    disable_session_recording: false,
    autocapture: false,
    enable_heatmaps: false,
  });
}

type EventName =
  | "page_view"
  | "cta_tapped"
  | "session_start"
  | "phase_start"
  | "gate_enter"
  | "gate_advance"
  | "elastic_interrupted"
  | "session_complete"
  | "session_abandon"
  | "survey_response"
  | "email_submit";

export function useAnalytics() {
  useEffect(() => {
    ensurePostHogInit();
  }, []);

  const track = useCallback((event: EventName, properties?: Record<string, unknown>) => {
    try {
      ensurePostHogInit();
      posthog.capture(event, properties);
    } catch {
      // Analytics should never break the app
    }
  }, []);

  return { track };
}

export function useAbandonTracking(
  getState: () => { state: string; stepId: string; audioPosition: number }
) {
  const stateGetterRef = useRef(getState);
  stateGetterRef.current = getState;

  useEffect(() => {
    ensurePostHogInit();
    let sent = false;

    const fire = () => {
      if (sent) return;
      const { state, stepId, audioPosition } = stateGetterRef.current();
      if (state === "COMPLETE" || state === "LOADING") return;
      sent = true;

      const properties = { last_state: state, last_step_id: stepId, audio_position: audioPosition };
      try {
        posthog.capture("session_abandon", properties);
      } catch {
        // fall through
      }

      // Beacon fallback for tab close
      try {
        const blob = new Blob(
          [JSON.stringify({ event: "session_abandon", properties, timestamp: Date.now() })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/track", blob);
      } catch {
        // best effort
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") fire();
    };

    window.addEventListener("pagehide", fire);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pagehide", fire);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
