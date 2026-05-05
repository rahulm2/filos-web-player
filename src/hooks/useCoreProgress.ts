"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { PlaybackPlan } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface OrderedChunk {
  phaseIdx: number;
  stepIdx: number;
  chunkIdx: number;
  duration: number;
  cumulativeStart: number; // cumulative core seconds before this chunk
  audioStartTime: number;  // actual start_time in the master file
}

interface CoreProgressInfo {
  totalCoreDuration: number;
  elapsedCoreDuration: number;
  elapsedFormatted: string;
  remainingFormatted: string;
  progress: number;
  /** Given a 0-1 progress, returns the phase/step/chunk + audio seek time */
  resolveSeek: (progress: number) => {
    phaseIndex: number;
    stepIndex: number;
    chunkIndex: number;
    audioTime: number;
  } | null;
}

export function useCoreProgress(
  plan: PlaybackPlan,
  phaseIndex: number,
  stepIndex: number,
  chunkIndex: number,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isPlaying: boolean
): CoreProgressInfo {
  const { totalCoreDuration, orderedChunks } = useMemo(() => {
    let total = 0;
    const chunks: OrderedChunk[] = [];
    for (let pi = 0; pi < plan.phases.length; pi++) {
      for (let si = 0; si < plan.phases[pi].steps.length; si++) {
        for (let ci = 0; ci < plan.phases[pi].steps[si].core_chunks.length; ci++) {
          const c = plan.phases[pi].steps[si].core_chunks[ci];
          const dur = c.end_time - c.start_time;
          chunks.push({
            phaseIdx: pi,
            stepIdx: si,
            chunkIdx: ci,
            duration: dur,
            cumulativeStart: total,
            audioStartTime: c.start_time,
          });
          total += dur;
        }
      }
    }
    return { totalCoreDuration: total, orderedChunks: chunks };
  }, [plan]);

  const [elapsedCoreDuration, setElapsedCoreDuration] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
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
    const currentPhase = plan.phases[phaseIndex];
    const currentStep = currentPhase?.steps[stepIndex];
    const currentChunk = currentStep?.core_chunks[chunkIndex];

    const computeElapsed = () => {
      const audio = audioRef.current;
      if (!audio || !currentChunk) return baseElapsed;
      const withinChunk = Math.max(0, Math.min(
        audio.currentTime - currentChunk.start_time,
        currentChunk.end_time - currentChunk.start_time
      ));
      return baseElapsed + withinChunk;
    };

    if (!isPlaying) {
      setElapsedCoreDuration(computeElapsed());
      return;
    }

    if (!audioRef.current || !currentChunk) {
      setElapsedCoreDuration(baseElapsed);
      return;
    }

    const tick = () => {
      setElapsedCoreDuration(computeElapsed());
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [plan, phaseIndex, stepIndex, chunkIndex, isPlaying, audioRef, orderedChunks]);

  const resolveSeek = useCallback((targetProgress: number) => {
    if (orderedChunks.length === 0) return null;
    const targetSeconds = targetProgress * totalCoreDuration;

    // Find which chunk this falls into
    for (let i = 0; i < orderedChunks.length; i++) {
      const c = orderedChunks[i];
      const chunkEnd = c.cumulativeStart + c.duration;
      if (targetSeconds <= chunkEnd || i === orderedChunks.length - 1) {
        const offsetIntoChunk = Math.max(0, targetSeconds - c.cumulativeStart);
        return {
          phaseIndex: c.phaseIdx,
          stepIndex: c.stepIdx,
          chunkIndex: c.chunkIdx,
          audioTime: c.audioStartTime + offsetIntoChunk,
        };
      }
    }
    return null;
  }, [orderedChunks, totalCoreDuration]);

  const progress = totalCoreDuration > 0 ? elapsedCoreDuration / totalCoreDuration : 0;
  const remaining = Math.max(0, totalCoreDuration - elapsedCoreDuration);

  return {
    totalCoreDuration,
    elapsedCoreDuration,
    elapsedFormatted: formatTime(elapsedCoreDuration),
    remainingFormatted: `-${formatTime(remaining)}`,
    progress,
    resolveSeek,
  };
}
