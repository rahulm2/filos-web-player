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

    const fire = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      firedRef.current = true;
      audio.pause();
      onBoundary();
    };

    const checkBoundary = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      const ct = audio.currentTime;
      // Only fire if we're genuinely in this chunk's territory AND past end
      if (ct >= startTime && ct >= endTime) {
        fire();
      }
    };

    // Use timeupdate (iOS fires this reliably ~4Hz) + rAF (desktop precision)
    const onTimeUpdate = () => checkBoundary();
    audio.addEventListener("timeupdate", onTimeUpdate);

    const tick = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      checkBoundary();
      raf = requestAnimationFrame(tick);
    };

    // Delay start — let playFrom() seek first
    const startDelay = setTimeout(() => {
      if (gen !== generationRef.current) return;
      raf = requestAnimationFrame(tick);

      // Fallback timeout for background tabs
      const rate = audio.playbackRate || 1;
      const remaining = Math.max(0, ((endTime - audio.currentTime) / rate) * 1000);
      fallbackTimeout = setTimeout(() => {
        if (firedRef.current || gen !== generationRef.current) return;
        const ct = audio.currentTime;
        if (ct >= startTime && ct >= endTime - 0.5) {
          fire();
        }
      }, remaining + 500);
    }, 150);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      cancelAnimationFrame(raf);
      clearTimeout(startDelay);
      clearTimeout(fallbackTimeout);
    };
  }, [audio, endTime, startTime, onBoundary]);
}
