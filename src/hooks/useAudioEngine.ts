"use client";

import { useRef, useCallback, useState } from "react";
import { timing } from "@/lib/constants";

interface AudioEngine {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isReady: boolean;
  init: () => Promise<void>;
  playFrom: (startTime: number, endTime: number) => void;
  pause: () => void;
  resume: () => void;
  fadeOut: () => Promise<void>;
  getCurrentTime: () => number;
}

export function useAudioEngine(audioUrl: string): AudioEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  const init = useCallback(async () => {
    if (ctxRef.current) return;

    // Create audio element if not exists
    if (!audioRef.current) {
      const audio = new Audio();
      audio.src = audioUrl;
      audio.preload = "metadata";
      audio.crossOrigin = "anonymous";
      audio.setAttribute("playsinline", "");
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    // Create AudioContext
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    await ctx.resume();

    // Prime audio element (must happen in user gesture)
    audio.load();
    try {
      await audio.play();
    } catch {
      // Expected on some browsers
    }
    audio.pause();
    audio.currentTime = 0;

    // Wire GainNode
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    source.connect(gain).connect(ctx.destination);

    // Silent oscillator for mute switch workaround
    const osc = ctx.createOscillator();
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0.001;
    osc.connect(silentGain).connect(ctx.destination);
    osc.start();

    ctxRef.current = ctx;
    gainRef.current = gain;
    setIsReady(true);
  }, [audioUrl]);

  const playFrom = useCallback((startTime: number, _endTime: number) => {
    const audio = audioRef.current;
    const gain = gainRef.current;
    const ctx = ctxRef.current;
    if (!audio || !gain || !ctx) return;

    // Reset gain to full volume
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(1, ctx.currentTime);

    audio.currentTime = startTime;
    audio.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "running") {
      ctx.resume();
    }
    audioRef.current?.play();
  }, []);

  const fadeOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = ctxRef.current;
      const gain = gainRef.current;
      const audio = audioRef.current;
      if (!ctx || !gain || !audio) {
        resolve();
        return;
      }

      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + timing.fadeMs / 1000);

      setTimeout(() => {
        audio.pause();
        // Reset gain for next play
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(1, ctx.currentTime);
        resolve();
      }, timing.fadeMs + 20);
    });
  }, []);

  const getCurrentTime = useCallback((): number => {
    return audioRef.current?.currentTime ?? 0;
  }, []);

  return { audioRef, isReady, init, playFrom, pause, resume, fadeOut, getCurrentTime };
}
