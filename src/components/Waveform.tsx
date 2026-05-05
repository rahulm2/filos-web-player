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
  barCount = 15,
  color = "#C9944A",
  inactiveColor = "#40372E",
}: WaveformProps) {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(0.15));
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!analyser || !active) {
      // Show idle state — gentle center-biased shape
      setBars(
        Array.from({ length: barCount }, (_, i) => {
          const center = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
          return 0.1 + center * 0.15;
        })
      );
      return;
    }

    if (!dataRef.current) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const tick = () => {
      if (!analyser || !dataRef.current) return;
      analyser.getByteFrequencyData(dataRef.current);

      const binCount = dataRef.current.length;
      const binsPerBar = Math.floor(binCount / barCount);
      const newBars: number[] = [];

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          sum += dataRef.current[i * binsPerBar + j];
        }
        const avg = sum / binsPerBar / 255;
        // Apply center bias — center bars are naturally taller
        const centerBias = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
        const value = Math.max(0.08, avg * (0.6 + centerBias * 0.4));
        newBars.push(value);
      }

      setBars(newBars);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, active, barCount]);

  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height: 52 }}>
      {bars.map((val, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-100"
          style={{
            width: 3,
            height: `${Math.max(3, val * 44)}px`,
            backgroundColor: active ? color : inactiveColor,
          }}
        />
      ))}
    </div>
  );
}
