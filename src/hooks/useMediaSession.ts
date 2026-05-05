"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PlaybackPlan } from "@/lib/types";

export function useMediaSession(
  plan: PlaybackPlan,
  handlers: {
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onSeek?: (progress: number) => void;
  },
  coreDuration?: number,
  coreElapsed?: number
) {
  const coreDurationRef = useRef(coreDuration ?? 0);
  const coreElapsedRef = useRef(coreElapsed ?? 0);
  const lastReportedRef = useRef(0);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  coreDurationRef.current = coreDuration ?? 0;
  coreElapsedRef.current = coreElapsed ?? 0;

  // Throttled position update — max once per second, never goes backwards
  const updatePosition = useCallback(() => {
    if (!("mediaSession" in navigator) || !coreDurationRef.current) return;
    const pos = Math.min(coreElapsedRef.current, coreDurationRef.current);
    // Don't report backwards jumps (step transitions cause momentary dip)
    if (pos < lastReportedRef.current - 1) return;
    lastReportedRef.current = pos;
    try {
      navigator.mediaSession.setPositionState({
        duration: coreDurationRef.current,
        position: Math.max(0, pos),
        playbackRate: 1,
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (!coreDuration) return;
    if (throttleRef.current) clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(updatePosition, 1000);
    return () => { if (throttleRef.current) clearTimeout(throttleRef.current); };
  }, [coreDuration, coreElapsed, updatePosition]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: plan.recipe.title,
      artist: plan.recipe.creator,
      album: "Cookalong",
      artwork: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    if (handlers.onPlay) {
      navigator.mediaSession.setActionHandler("play", handlers.onPlay);
    }
    if (handlers.onPause) {
      navigator.mediaSession.setActionHandler("pause", handlers.onPause);
    }
    if (handlers.onNext) {
      navigator.mediaSession.setActionHandler("nexttrack", handlers.onNext);
    }
    if (handlers.onPrevious) {
      navigator.mediaSession.setActionHandler("previoustrack", handlers.onPrevious);
    }

    // Wire seek controls to in-app scrubber logic
    try {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null && handlers.onSeek && coreDurationRef.current > 0) {
          const progress = details.seekTime / coreDurationRef.current;
          lastReportedRef.current = details.seekTime;
          handlers.onSeek(Math.max(0, Math.min(1, progress)));
        }
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset ?? 10;
        if (handlers.onSeek && coreDurationRef.current > 0) {
          const newTime = Math.max(0, coreElapsedRef.current - offset);
          lastReportedRef.current = newTime;
          handlers.onSeek(newTime / coreDurationRef.current);
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const offset = details.seekOffset ?? 10;
        if (handlers.onSeek && coreDurationRef.current > 0) {
          const newTime = Math.min(coreDurationRef.current, coreElapsedRef.current + offset);
          handlers.onSeek(newTime / coreDurationRef.current);
        }
      });
    } catch {
      // Some browsers don't support these
    }

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      try {
        navigator.mediaSession.setActionHandler("seekto", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      } catch {}
    };
  }, [plan, handlers]);
}
