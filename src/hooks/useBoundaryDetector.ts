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

    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;

    const fire = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      firedRef.current = true;
      audio.pause();
      onBoundary();
    };

    // rAF for foreground precision (~16ms)
    const tick = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      if (!audio.paused && audio.currentTime >= endTime) {
        fire();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // setTimeout as background-tab fallback
    const remaining = Math.max(0, (endTime - audio.currentTime) * 1000);
    timeout = setTimeout(() => {
      if (firedRef.current || gen !== generationRef.current) return;
      if (audio.currentTime >= endTime - 0.05) {
        fire();
      }
    }, remaining + 100);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [audio, endTime, onBoundary]);
}
