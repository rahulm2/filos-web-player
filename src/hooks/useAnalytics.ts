"use client";

import { useCallback, useEffect, useRef } from "react";

type EventName =
  | "page_view"
  | "cta_tap"
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
  const track = useCallback((event: EventName, properties?: Record<string, unknown>) => {
    // PostHog integration — for now just log in dev
    if (process.env.NODE_ENV === "development") {
      console.log(`[analytics] ${event}`, properties);
    }

    // Send to our API route for server-side forwarding
    try {
      const payload = JSON.stringify({ event, properties, timestamp: Date.now() });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", payload);
      } else {
        fetch("/api/track", {
          method: "POST",
          body: payload,
          keepalive: true,
        });
      }
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
    let sent = false;

    const fire = () => {
      if (sent) return;
      const { state, stepId, audioPosition } = stateGetterRef.current();
      if (state === "COMPLETE" || state === "LOADING") return;
      sent = true;

      const blob = new Blob(
        [JSON.stringify({
          event: "session_abandon",
          properties: { last_state: state, last_step_id: stepId, audio_position: audioPosition },
          timestamp: Date.now(),
        })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/track", blob);
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
