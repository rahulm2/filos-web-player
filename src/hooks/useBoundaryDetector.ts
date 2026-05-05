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

    const fire = () => {
      if (firedRef.current || gen !== generationRef.current) return;
      firedRef.current = true;
      audio.pause();
      onBoundary();
    };

    let raf: number;
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    // Wait until the audio has actually seeked to our chunk's region
    // before starting boundary detection. iOS seeking is async.
    const waitForSeek = () => {
      if (gen !== generationRef.current) return;

      // Check if audio.currentTime is in our chunk's range (or close to start)
      const ct = audio.currentTime;
      const inRange = ct >= startTime - 1 && ct <= endTime + 1;

      if (!inRange) {
        // Not seeked yet — keep waiting
        raf = requestAnimationFrame(waitForSeek);
        return;
      }

      // Now start actual boundary detection
      const tick = () => {
        if (firedRef.current || gen !== generationRef.current) return;
        if (!audio.paused && audio.currentTime >= endTime - 0.05) {
          fire();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      // setTimeout fallback for background tabs
      const rate = audio.playbackRate || 1;
      const remaining = Math.max(0, ((endTime - audio.currentTime) / rate) * 1000);
      fallbackTimeout = setTimeout(() => {
        if (firedRef.current || gen !== generationRef.current) return;
        if (audio.currentTime >= endTime - 0.1) {
          fire();
        }
      }, remaining + 500);
    };

    raf = requestAnimationFrame(waitForSeek);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallbackTimeout);
    };
  }, [audio, endTime, startTime, onBoundary]);
}
