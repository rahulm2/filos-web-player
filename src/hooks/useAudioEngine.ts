"use client";

import { useRef, useCallback, useState } from "react";
import { timing } from "@/lib/constants";

interface AudioEngine {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isReady: boolean;
  init: () => Promise<void>;
  playFrom: (startTime: number, endTime: number) => void;
  pause: () => void;
  resume: () => void;
  fadeOut: () => Promise<void>;
  getCurrentTime: () => number;
  setSpeed: (speed: number) => void;
}

export function useAudioEngine(audioUrl: string): AudioEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  const init = useCallback(async () => {
    if (ctxRef.current) return;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.src = audioUrl;
      audio.preload = "metadata";
      audio.crossOrigin = "anonymous";
      audio.setAttribute("playsinline", "");
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    await ctx.resume();

    // Prime audio element — play+pause unlocks iOS audio
    // Must await play() before calling pause() to avoid AbortError
    audio.load();
    try {
      const playPromise = audio.play();
      if (playPromise) {
        await playPromise;
        audio.pause();
        audio.currentTime = 0;
      }
    } catch {
      // Expected on browsers that block autoplay — element is still primed
      audio.currentTime = 0;
    }

    // Wire: source → analyser → gain → destination
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    const gain = ctx.createGain();
    source.connect(analyser).connect(gain).connect(ctx.destination);

    // Silent oscillator for mute switch
    const osc = ctx.createOscillator();
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0.001;
    osc.connect(silentGain).connect(ctx.destination);
    osc.start();

    ctxRef.current = ctx;
    gainRef.current = gain;
    analyserRef.current = analyser;
    setIsReady(true);
  }, [audioUrl]);

  const playFrom = useCallback((startTime: number, _endTime: number) => {
    const audio = audioRef.current;
    const gain = gainRef.current;
    const ctx = ctxRef.current;
    if (!audio || !gain || !ctx) return;

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
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(1, ctx.currentTime);
        resolve();
      }, timing.fadeMs + 20);
    });
  }, []);

  const getCurrentTime = useCallback((): number => {
    return audioRef.current?.currentTime ?? 0;
  }, []);

  const setSpeed = useCallback((speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    audio.preservesPitch = true;
  }, []);

  return { audioRef, analyserRef, isReady, init, playFrom, pause, resume, fadeOut, getCurrentTime, setSpeed };
}
