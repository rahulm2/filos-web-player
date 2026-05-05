"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { timing } from "@/lib/constants";

interface AudioEngine {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isReady: boolean;
  isBuffering: boolean;
  preloadProgress: number;
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
  const blobUrlRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Prefetch entire file as blob on mount — all seeks from memory after this
  useEffect(() => {
    let cancelled = false;

    const prefetch = async () => {
      try {
        const response = await fetch(audioUrl);
        if (cancelled) return;

        const reader = response.body?.getReader();
        const contentLength = Number(response.headers.get("content-length")) || 0;

        if (!reader) {
          // Fallback: no streaming reader, just get the blob directly
          const blob = await (await fetch(audioUrl)).blob();
          if (cancelled) return;
          blobUrlRef.current = URL.createObjectURL(blob);
          setPreloadProgress(1);
          createAudioElement(blobUrlRef.current);
          return;
        }

        // Stream download with progress
        const chunks: BlobPart[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (cancelled) return;
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (contentLength > 0) {
            setPreloadProgress(received / contentLength);
          }
        }

        const blob = new Blob(chunks, { type: "audio/mpeg" });
        blobUrlRef.current = URL.createObjectURL(blob);
        setPreloadProgress(1);
        createAudioElement(blobUrlRef.current);
      } catch {
        // Fallback: use original URL (will make range requests on seek)
        createAudioElement(audioUrl);
        setPreloadProgress(1);
      }
    };

    const createAudioElement = (src: string) => {
      if (audioRef.current) return;
      const audio = new Audio();
      audio.src = src;
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.setAttribute("playsinline", "");
      audioRef.current = audio;

      const onWaiting = () => setIsBuffering(true);
      const onCanPlay = () => setIsBuffering(false);
      const onPlaying = () => setIsBuffering(false);
      audio.addEventListener("waiting", onWaiting);
      audio.addEventListener("canplay", onCanPlay);
      audio.addEventListener("playing", onPlaying);
    };

    prefetch();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [audioUrl]);

  const init = useCallback(async () => {
    if (ctxRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    await ctx.resume();

    // Prime audio element
    audio.load();
    try {
      const playPromise = audio.play();
      if (playPromise) {
        await playPromise;
        audio.pause();
        audio.currentTime = 0;
      }
    } catch {
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
  }, []);

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

  return { audioRef, analyserRef, isReady, isBuffering, preloadProgress, init, playFrom, pause, resume, fadeOut, getCurrentTime, setSpeed };
}
