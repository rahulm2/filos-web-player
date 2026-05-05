"use client";

import { useEffect, useRef } from "react";
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
  coreDurationRef.current = coreDuration ?? 0;
  coreElapsedRef.current = coreElapsed ?? 0;

  // Update position state so the tray scrubber stays in sync
  useEffect(() => {
    if (!("mediaSession" in navigator) || !coreDuration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: coreDuration,
        position: Math.min(coreElapsed ?? 0, coreDuration),
        playbackRate: 1,
      });
    } catch {
      // Some browsers reject invalid values
    }
  }, [coreDuration, coreElapsed]);

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
          handlers.onSeek(Math.max(0, Math.min(1, progress)));
        }
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset ?? 10;
        if (handlers.onSeek && coreDurationRef.current > 0) {
          const newTime = Math.max(0, coreElapsedRef.current - offset);
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
