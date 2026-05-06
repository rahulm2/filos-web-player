"use client";

import { useRef, useState, useCallback } from "react";
import type { CascadeEntry } from "@/lib/types";
import { timing } from "@/lib/constants";

interface CascadeState {
  isRunning: boolean;
  statusText: string;
  phase: "silence" | "heartbeat" | "elastic" | "idle" | "inactive";
  isPlayingAudio: boolean;
}

interface CascadeControls {
  state: CascadeState;
  start: (
    cascade: CascadeEntry[],
    playAudio: (start: number, end: number) => void,
    fadeOut: () => Promise<void>,
    pauseAudio: () => void,
    getAudioTime: () => number
  ) => void;
  interrupt: () => Promise<void>;
  replay: () => Promise<void>;
  pauseCascade: () => void;
  resumeCascade: () => boolean;
  isRunning: () => boolean;
}

export function useCascadeSequencer(): CascadeControls {
  const [state, setState] = useState<CascadeState>({
    isRunning: false,
    statusText: "",
    phase: "inactive",
    isPlayingAudio: false,
  });

  const abortRef = useRef(false);
  const pausedRef = useRef(false);
  const currentFadeOut = useRef<(() => Promise<void>) | null>(null);
  const currentPauseAudio = useRef<(() => void) | null>(null);
  const isPlayingAudioRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const currentEntryIdxRef = useRef(0);
  const argsRef = useRef<{
    cascade: CascadeEntry[];
    playAudio: (start: number, end: number) => void;
    fadeOut: () => Promise<void>;
    pauseAudio: () => void;
    getAudioTime: () => number;
  } | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => {
      let elapsed = 0;
      const interval = 100;
      const tick = () => {
        if (abortRef.current) { resolve(); return; }
        if (pausedRef.current) {
          timeoutRef.current = setTimeout(tick, interval);
          return;
        }
        elapsed += interval;
        if (elapsed >= ms) { resolve(); return; }
        timeoutRef.current = setTimeout(tick, interval);
      };
      timeoutRef.current = setTimeout(tick, interval);
    });
  }, []);

  const waitForAudioEnd = useCallback((endTime: number, getTime: () => number): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        if (abortRef.current) { resolve(); return; }
        if (pausedRef.current) {
          timeoutRef.current = setTimeout(check, 100);
          return;
        }
        if (getTime() >= endTime - 0.1) { resolve(); return; }
        timeoutRef.current = setTimeout(check, 80);
      };
      timeoutRef.current = setTimeout(check, 80);
    });
  }, []);

  const start = useCallback(
    (
      cascade: CascadeEntry[],
      playAudio: (start: number, end: number) => void,
      fadeOut: () => Promise<void>,
      pauseAudio: () => void,
      getAudioTime: () => number
    ) => {
      if (runningRef.current) return;
      runningRef.current = true;
      abortRef.current = false;
      pausedRef.current = false;
      currentFadeOut.current = fadeOut;
      currentPauseAudio.current = pauseAudio;
      isPlayingAudioRef.current = false;
      currentEntryIdxRef.current = 0;
      argsRef.current = { cascade, playAudio, fadeOut, pauseAudio, getAudioTime };

      setState({ isRunning: true, statusText: "Take your time...", phase: "silence", isPlayingAudio: false });

      const run = async () => {
        for (let i = 0; i < cascade.length; i++) {
          if (abortRef.current) break;
          currentEntryIdxRef.current = i;
          const entry = cascade[i];

          switch (entry.type) {
            case "silence":
              setState((s) => ({ ...s, phase: "silence", statusText: "Take your time...", isPlayingAudio: false }));
              await sleep(entry.duration_seconds * 1000);
              break;

            case "heartbeat":
              setState((s) => ({
                ...s,
                phase: "heartbeat",
                statusText: entry.fallback_message,
                isPlayingAudio: !!entry.chunk,
              }));
              if (entry.chunk) {
                isPlayingAudioRef.current = true;
                playAudio(entry.chunk.start_time, entry.chunk.end_time);
                await waitForAudioEnd(entry.chunk.end_time, getAudioTime);
                if (!abortRef.current) {
                  pauseAudio();
                  isPlayingAudioRef.current = false;
                  setState((s) => ({ ...s, isPlayingAudio: false }));
                }
              } else {
                await sleep(timing.heartbeatTextMs);
              }
              break;

            case "elastic":
              setState((s) => ({
                ...s,
                phase: "elastic",
                statusText: entry.relevance_label
                  ? `${entry.relevance_label.split(" — ")[0]}...`
                  : "Clare's sharing something...",
                isPlayingAudio: true,
              }));
              isPlayingAudioRef.current = true;
              playAudio(entry.chunk.start_time, entry.chunk.end_time);
              await waitForAudioEnd(entry.chunk.end_time, getAudioTime);
              if (!abortRef.current) {
                pauseAudio();
                isPlayingAudioRef.current = false;
                setState((s) => ({ ...s, isPlayingAudio: false }));
              }
              break;
          }
        }

        // Cascade exhausted
        if (!abortRef.current) {
          setState({
            isRunning: true,
            statusText: "Clare's here when you're ready",
            phase: "idle",
            isPlayingAudio: false,
          });
        }
        runningRef.current = false;
      };

      run();
    },
    [sleep, waitForAudioEnd]
  );

  const interrupt = useCallback(async () => {
    abortRef.current = true;
    clearPendingTimeout();

    if (isPlayingAudioRef.current && currentFadeOut.current) {
      await currentFadeOut.current();
      isPlayingAudioRef.current = false;
    } else if (currentPauseAudio.current) {
      currentPauseAudio.current();
    }

    runningRef.current = false;
    setState({ isRunning: false, statusText: "", phase: "inactive", isPlayingAudio: false });
  }, [clearPendingTimeout]);

  // Restart the cascade from the current audio entry (heartbeat/elastic).
  // If the current entry is silence, restarts from the next audio entry instead.
  const replay = useCallback(async () => {
    const args = argsRef.current;
    if (!args) return;

    // Find the entry to replay: current one if it has audio, otherwise scan forward
    let replayIdx = currentEntryIdxRef.current;
    const cur = args.cascade[replayIdx];
    if (cur?.type === "silence") {
      // Skip to the next non-silence entry
      for (let i = replayIdx + 1; i < args.cascade.length; i++) {
        if (args.cascade[i].type !== "silence") { replayIdx = i; break; }
      }
    }

    // Interrupt current, then restart from replayIdx
    await interrupt();
    const sliced = args.cascade.slice(replayIdx);
    if (sliced.length > 0) {
      start(sliced, args.playAudio, args.fadeOut, args.pauseAudio, args.getAudioTime);
    }
  }, [interrupt, start]);

  const pauseCascade = useCallback(() => {
    pausedRef.current = true;
    if (isPlayingAudioRef.current && currentPauseAudio.current) {
      currentPauseAudio.current();
    }
  }, []);

  const resumeCascade = useCallback((): boolean => {
    if (!runningRef.current) return false;
    pausedRef.current = false;
    return isPlayingAudioRef.current;
  }, []);

  const isRunning = useCallback(() => runningRef.current, []);

  return { state, start, interrupt, replay, pauseCascade, resumeCascade, isRunning };
}
