"use client";

import { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";

let initialized = false;
let useServerRelay = false;

function ensurePostHogInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) {
    console.warn("[Analytics] No NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN — events will be no-ops");
    return;
  }

  // Safari ITP blocks third-party requests to posthog.com
  // Detect Safari and use server relay instead
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  useServerRelay = isSafari;

  // Clear stale config
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("ph_") && key.includes("posthog")) {
        localStorage.removeItem(key);
      }
    }
  } catch {}

  if (!isSafari) {
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
}

function serverTrack(event: string, properties?: Record<string, unknown>) {
  try {
    const payload = JSON.stringify({
      event,
      properties: { ...properties, $lib: "server-relay" },
      timestamp: Date.now(),
      distinct_id: "safari-" + (Math.random().toString(36).slice(2, 10)),
    });
    navigator.sendBeacon("/api/track", payload);
  } catch {}
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
  | "session_abandon_feedback"
  | "survey_response"
  | "form_submit"
  | "step_navigate"
  | "step_back"
  | "step_repeat"
  | "step_skip";

export function useAnalytics() {
  useEffect(() => {
    ensurePostHogInit();
  }, []);

  const track = useCallback((event: EventName, properties?: Record<string, unknown>) => {
    try {
      ensurePostHogInit();
      if (useServerRelay) {
        serverTrack(event, properties);
      } else {
        posthog.capture(event, properties);
      }
    } catch {}
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
      if (useServerRelay) {
        serverTrack("session_abandon", properties);
      } else {
        try { posthog.capture("session_abandon", properties); } catch {}
      }

      // Beacon fallback
      try {
        const blob = new Blob(
          [JSON.stringify({ event: "session_abandon", properties, timestamp: Date.now() })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/track", blob);
      } catch {}
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
