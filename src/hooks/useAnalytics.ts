"use client";

import { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";

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
  const track = useCallback((event: EventName, properties?: Record<string, unknown>) => {
    try {
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
        // fall through to beacon
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
