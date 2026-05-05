"use client";

import { useEffect, useRef } from "react";

export function useBoundaryDetector(
  audio: HTMLAudioElement | null,
  endTime: number | null,
  startTime: number | null,
  onBoundary: () => void
) {
  const firedRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    if (!audio || endTime === null || startTime === null) return;

    firedRef.current = false;
    generationRef.current++;
    const gen = generationRef.current;

    let raf: number;
    let fallbackTimeout: ReturnType<typeof setTimeout>;
    let seekConfirmed = false;

    const fire = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      firedRef.current = true;
      audio.pause();
      onBoundary();
    };

    const tick = () => {
      if (firedRef.current || gen !== generationRef.current) return;

      const ct = audio.currentTime;

      if (!seekConfirmed) {
        // Wait until audio has seeked into our chunk range
        if (ct >= startTime - 1 && ct <= endTime + 1) {
          seekConfirmed = true;
          // Now set the fallback timeout based on actual position
          const rate = audio.playbackRate || 1;
          const remaining = Math.max(0, ((endTime - ct) / rate) * 1000);
          fallbackTimeout = setTimeout(() => {
            if (firedRef.current || gen !== generationRef.current) return;
            // Double-check position — only fire if genuinely at the end
            if (audio.currentTime >= endTime - 0.3 && seekConfirmed) {
              fire();
            }
          }, remaining + 300);
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      // Seek confirmed — check for boundary
      // Use >= endTime (no early tolerance) to avoid cutting short on iOS
      if (!audio.paused && ct >= endTime) {
        fire();
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallbackTimeout);
    };
  }, [audio, endTime, startTime, onBoundary]);
}
