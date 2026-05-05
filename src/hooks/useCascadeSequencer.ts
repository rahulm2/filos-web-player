"use client";

import { useRef, useState, useCallback } from "react";
import type { CascadeEntry } from "@/lib/types";
import { timing } from "@/lib/constants";

interface CascadeState {
  isRunning: boolean;
  statusText: string;
  phase: "silence" | "heartbeat" | "elastic" | "idle" | "inactive";
}

interface CascadeControls {
  state: CascadeState;
  start: (
    cascade: CascadeEntry[],
    playAudio: (start: number, end: number) => void,
    fadeOut: () => Promise<void>,
    pauseAudio: () => void
  ) => void;
  interrupt: () => Promise<void>;
  pauseCascade: () => void;
  resumeCascade: () => void;
}

export function useCascadeSequencer(): CascadeControls {
  const [state, setState] = useState<CascadeState>({
    isRunning: false,
    statusText: "",
    phase: "inactive",
  });

  const abortRef = useRef(false);
  const pausedRef = useRef(false);
  const currentFadeOut = useRef<(() => Promise<void>) | null>(null);
  const currentPauseAudio = useRef<(() => void) | null>(null);
  const isPlayingAudio = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const waitMs = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => {
      const checkInterval = 100;
      let elapsed = 0;
      const check = () => {
        if (abortRef.current) {
          resolve();
          return;
        }
        if (pausedRef.current) {
          timeoutRef.current = setTimeout(check, checkInterval);
          return;
        }
        elapsed += checkInterval;
        if (elapsed >= ms) {
          resolve();
          return;
        }
        timeoutRef.current = setTimeout(check, checkInterval);
      };
      timeoutRef.current = setTimeout(check, checkInterval);
    });
  }, []);

  const waitForAudioEnd = useCallback((endTime: number, getTime: () => number): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        if (abortRef.current) {
          resolve();
          return;
        }
        if (getTime() >= endTime) {
          resolve();
          return;
        }
        timeoutRef.current = setTimeout(check, 50);
      };
      timeoutRef.current = setTimeout(check, 50);
    });
  }, []);

  const start = useCallback(
    (
      cascade: CascadeEntry[],
      playAudio: (start: number, end: number) => void,
      fadeOut: () => Promise<void>,
      pauseAudio: () => void
    ) => {
      abortRef.current = false;
      pausedRef.current = false;
      currentFadeOut.current = fadeOut;
      currentPauseAudio.current = pauseAudio;

      setState({ isRunning: true, statusText: "Take your time...", phase: "silence" });

      const run = async () => {
        for (const entry of cascade) {
          if (abortRef.current) return;

          switch (entry.type) {
            case "silence":
              setState((s) => ({ ...s, phase: "silence", statusText: "Take your time..." }));
              await waitMs(entry.duration_seconds * 1000);
              break;

            case "heartbeat":
              setState((s) => ({
                ...s,
                phase: "heartbeat",
                statusText: entry.fallback_message,
              }));
              if (entry.chunk) {
                isPlayingAudio.current = true;
                playAudio(entry.chunk.start_time, entry.chunk.end_time);
                await waitForAudioEnd(entry.chunk.end_time, () => 0); // simplified
                isPlayingAudio.current = false;
                pauseAudio();
              } else {
                await waitMs(timing.heartbeatTextMs);
              }
              break;

            case "elastic":
              setState((s) => ({
                ...s,
                phase: "elastic",
                statusText: entry.relevance_label
                  ? `Clare on ${entry.relevance_label.split(" — ")[0].toLowerCase()}...`
                  : "Clare's sharing something...",
              }));
              isPlayingAudio.current = true;
              playAudio(entry.chunk.start_time, entry.chunk.end_time);
              await waitForAudioEnd(entry.chunk.end_time, () => 0); // simplified
              isPlayingAudio.current = false;
              pauseAudio();
              break;
          }
        }

        // Cascade exhausted — idle
        if (!abortRef.current) {
          setState({
            isRunning: true,
            statusText: "Clare's here when you're ready",
            phase: "idle",
          });
        }
      };

      run();
    },
    [waitMs, waitForAudioEnd]
  );

  const interrupt = useCallback(async () => {
    abortRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (isPlayingAudio.current && currentFadeOut.current) {
      await currentFadeOut.current();
      isPlayingAudio.current = false;
    } else if (currentPauseAudio.current) {
      currentPauseAudio.current();
    }

    setState({ isRunning: false, statusText: "", phase: "inactive" });
  }, []);

  const pauseCascade = useCallback(() => {
    pausedRef.current = true;
    if (isPlayingAudio.current && currentPauseAudio.current) {
      currentPauseAudio.current();
    }
  }, []);

  const resumeCascade = useCallback(() => {
    pausedRef.current = false;
  }, []);

  return { state, start, interrupt, pauseCascade, resumeCascade };
}
