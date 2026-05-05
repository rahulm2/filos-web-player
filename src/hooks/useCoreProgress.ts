"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { PlaybackPlan } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface CoreProgressInfo {
  /** Total duration of all core chunks in seconds */
  totalCoreDuration: number;
  /** Elapsed core audio in seconds (chunks before current + progress within current) */
  elapsedCoreDuration: number;
  /** Formatted elapsed time */
  elapsedFormatted: string;
  /** Formatted remaining time */
  remainingFormatted: string;
  /** Progress 0-1 */
  progress: number;
}

export function useCoreProgress(
  plan: PlaybackPlan,
  phaseIndex: number,
  stepIndex: number,
  chunkIndex: number,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isPlaying: boolean
): CoreProgressInfo {
  // Pre-compute total core duration and ordered chunk list
  const { totalCoreDuration, orderedChunks } = useMemo(() => {
    let total = 0;
    const chunks: { phaseIdx: number; stepIdx: number; chunkIdx: number; duration: number }[] = [];
    for (let pi = 0; pi < plan.phases.length; pi++) {
      for (let si = 0; si < plan.phases[pi].steps.length; si++) {
        for (let ci = 0; ci < plan.phases[pi].steps[si].core_chunks.length; ci++) {
          const c = plan.phases[pi].steps[si].core_chunks[ci];
          const dur = c.end_time - c.start_time;
          chunks.push({ phaseIdx: pi, stepIdx: si, chunkIdx: ci, duration: dur });
          total += dur;
        }
      }
    }
    return { totalCoreDuration: total, orderedChunks: chunks };
  }, [plan]);

  const [elapsedCoreDuration, setElapsedCoreDuration] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Calculate elapsed from completed chunks
    let elapsed = 0;
    for (const c of orderedChunks) {
      if (
        c.phaseIdx < phaseIndex ||
        (c.phaseIdx === phaseIndex && c.stepIdx < stepIndex) ||
        (c.phaseIdx === phaseIndex && c.stepIdx === stepIndex && c.chunkIdx < chunkIndex)
      ) {
        elapsed += c.duration;
      }
    }

    const baseElapsed = elapsed;

    if (!isPlaying || !audioRef.current) {
      setElapsedCoreDuration(baseElapsed);
      return;
    }

    // Get current chunk to track progress within it
    const currentPhase = plan.phases[phaseIndex];
    const currentStep = currentPhase?.steps[stepIndex];
    const currentChunk = currentStep?.core_chunks[chunkIndex];

    if (!currentChunk) {
      setElapsedCoreDuration(baseElapsed);
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const withinChunk = Math.max(0, Math.min(
        audio.currentTime - currentChunk.start_time,
        currentChunk.end_time - currentChunk.start_time
      ));
      setElapsedCoreDuration(baseElapsed + withinChunk);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [plan, phaseIndex, stepIndex, chunkIndex, isPlaying, audioRef, orderedChunks]);

  const progress = totalCoreDuration > 0 ? elapsedCoreDuration / totalCoreDuration : 0;
  const remaining = Math.max(0, totalCoreDuration - elapsedCoreDuration);

  return {
    totalCoreDuration,
    elapsedCoreDuration,
    elapsedFormatted: formatTime(elapsedCoreDuration),
    remainingFormatted: `-${formatTime(remaining)}`,
    progress,
  };
}
