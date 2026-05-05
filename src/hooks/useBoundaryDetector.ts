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

    let interval: ReturnType<typeof setInterval>;
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    const fire = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      firedRef.current = true;
      audio.pause();
      onBoundary();
    };

    // Use setInterval at 30ms for tight polling — more reliable than
    // rAF on iOS which gets throttled, and more frequent than timeupdate (~250ms)
    const startDelay = setTimeout(() => {
      if (gen !== generationRef.current) return;

      interval = setInterval(() => {
        if (firedRef.current || gen !== generationRef.current) {
          clearInterval(interval);
          return;
        }
        const ct = audio.currentTime;
        // +0.15s buffer — let the last word finish before cutting
        if (ct >= startTime && ct >= endTime + 0.15) {
          clearInterval(interval);
          fire();
        }
      }, 30);

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
      clearTimeout(startDelay);
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
    };
  }, [audio, endTime, startTime, onBoundary]);
}
