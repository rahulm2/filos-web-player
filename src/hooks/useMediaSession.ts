"use client";

import { useEffect } from "react";
import type { PlaybackPlan } from "@/lib/types";

export function useMediaSession(
  plan: PlaybackPlan,
  handlers: {
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
  }
) {
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

    // Disable the seek scrubber in the notification tray
    // Registering these as no-ops tells the OS "don't show seek controls"
    try {
      navigator.mediaSession.setActionHandler("seekbackward", () => {});
      navigator.mediaSession.setActionHandler("seekforward", () => {});
      navigator.mediaSession.setActionHandler("seekto", () => {});
    } catch {
      // Some browsers don't support these handlers
    }

    // Don't report position — prevents scrubber from appearing
    // (not calling navigator.mediaSession.setPositionState)

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      try {
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {}
    };
  }, [plan, handlers]);
}
