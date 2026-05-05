"use client";

import { useEffect, useRef } from "react";

export function useBoundaryDetector(
  audio: HTMLAudioElement | null,
  endTime: number | null,
  onBoundary: () => void
) {
  const firedRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    if (!audio || endTime === null) return;

    firedRef.current = false;
    generationRef.current++;
    const gen = generationRef.current;

    const fire = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      firedRef.current = true;
      audio.pause();
      onBoundary();
    };

    // Small delay before starting detection — let playFrom() seek first
    let startTimeout: ReturnType<typeof setTimeout>;
    let raf: number;
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    startTimeout = setTimeout(() => {
      if (gen !== generationRef.current) return;

      // rAF for foreground precision (~16ms)
      const tick = () => {
        if (firedRef.current || gen !== generationRef.current) return;
        // Only fire if audio is actually playing near our expected end
        if (!audio.paused && audio.currentTime >= endTime - 0.05 && audio.currentTime <= endTime + 2) {
          fire();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      // setTimeout fallback for background tabs — account for playbackRate
      const rate = audio.playbackRate || 1;
      const remaining = Math.max(0, ((endTime - audio.currentTime) / rate) * 1000);
      fallbackTimeout = setTimeout(() => {
        if (firedRef.current || gen !== generationRef.current) return;
        // Verify we're actually near the end (not at some random cascade position)
        if (audio.currentTime >= endTime - 0.1 && audio.currentTime <= endTime + 2) {
          fire();
        }
      }, remaining + 200);
    }, 100);

    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(raf);
      clearTimeout(fallbackTimeout);
    };
  }, [audio, endTime, onBoundary]);
}
