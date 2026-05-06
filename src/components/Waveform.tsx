"use client";

import { useRef, useEffect, useState } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  active: boolean;
  barCount?: number;
  color?: string;
  inactiveColor?: string;
}

export function Waveform({
  analyser,
  active,
  barCount = 21,
  color = "#C9944A",
  inactiveColor = "#40372E",
}: WaveformProps) {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(0.15));
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!analyser || !active) {
      setBars(
        Array.from({ length: barCount }, (_, i) => {
          const center = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
          return 0.08 + center * 0.12;
        })
      );
      return;
    }

    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.25;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;

    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const tick = () => {
      if (!analyser || !dataRef.current) return;
      analyser.getByteFrequencyData(dataRef.current);

      const binCount = dataRef.current.length;
      const newBars: number[] = [];

      for (let i = 0; i < barCount; i++) {
        // Mirror from center: map bar index to frequency bin symmetrically
        const half = (barCount - 1) / 2;
        const distFromCenter = Math.abs(i - half);
        // Outer bars get lower frequency bins, center gets mid frequencies
        const binIdx = Math.floor((distFromCenter / half) * (binCount - 1));
        const raw = dataRef.current[Math.min(binIdx, binCount - 1)] / 255;

        // Aggressive amplification for speech sensitivity
        const amplified = Math.pow(raw, 0.4);
        // Strong center bias — center bars are taller
        const centerWeight = 1 - (distFromCenter / half) * 0.6;
        const value = Math.max(0.06, amplified * centerWeight);
        newBars.push(value);
      }

      setBars(newBars);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, active, barCount]);

  return (
    <div className="flex items-center justify-center gap-[2.5px]" style={{ height: 56 }}>
      {bars.map((val, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 2.5,
            height: `${Math.max(3, val * 48)}px`,
            backgroundColor: active ? color : inactiveColor,
            transition: "height 60ms ease-out",
          }}
        />
      ))}
    </div>
  );
}
