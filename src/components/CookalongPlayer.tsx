"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackPlan } from "@/lib/types";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePacingMachine } from "@/hooks/usePacingMachine";
import { useBoundaryDetector } from "@/hooks/useBoundaryDetector";
import { useCascadeSequencer } from "@/hooks/useCascadeSequencer";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAnalytics, useAbandonTracking } from "@/hooks/useAnalytics";
import { timing } from "@/lib/constants";
import { useCoreProgress } from "@/hooks/useCoreProgress";
import { PreCookScreen } from "./PreCookScreen";
import { CookScreen } from "./CookScreen";
import { GateScreen } from "./GateScreen";
import { CompleteScreen } from "./CompleteScreen";
import { AbandonFeedbackScreen } from "./AbandonFeedbackScreen";
import { OnboardingInterstitial } from "./OnboardingInterstitial";

export function CookalongPlayer({ plan }: { plan: PlaybackPlan }) {
  const engine = useAudioEngine(plan.recipe.audio_url);
  const pacing = usePacingMachine(plan);
  const cascade = useCascadeSequencer();
  const { track } = useAnalytics();
  const seamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResuming = useRef(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // iOS uses WebKit for all browsers — playbackRate glitches through MediaElementSourceNode
  const isIOSRef = useRef(false);
  if (typeof navigator !== "undefined" && !isIOSRef.current) {
    isIOSRef.current = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    engine.setSpeed(speed);
  }, [engine]);

  const currentPhase = plan.phases[pacing.phaseIndex];
  const currentStep = currentPhase?.steps[pacing.stepIndex];

  const coreProgress = useCoreProgress(
    plan, pacing.phaseIndex, pacing.stepIndex, pacing.chunkIndex,
    engine.audioRef, pacing.state === "PLAYING"
  );

  // Wake lock while cooking
  useWakeLock(pacing.state !== "LOADING" && pacing.state !== "COMPLETE");

  // Media Session
  const handleNext = useCallback(async () => {
    if (pacing.state === "WAITING" || pacing.state === "PHASE_GATE") {
      await cascade.interrupt();
      track("gate_advance", { step_id: currentStep?.step_id });
      pacing.dispatch({ type: "ADVANCE" });
    } else if (pacing.state === "PLAYING") {
      engine.pause();
      track("step_skip", { step_id: currentStep?.step_id, phase_index: pacing.phaseIndex });
      pacing.dispatch({ type: "ADVANCE" });
    } else if (pacing.state === "PAUSED") {
      const prevState = pacing.previousState;
      if (prevState === "WAITING" || prevState === "PHASE_GATE") {
        await cascade.interrupt();
      }
      pacing.dispatch({ type: "ADVANCE" });
    }
  }, [pacing, cascade, engine, currentStep, track]);

  const seekRef = useRef<((p: number) => void) | null>(null);

  useMediaSession(plan, {
    onPlay: () => {
      const cascadeWasPlaying = cascade.resumeCascade();
      if (cascadeWasPlaying) {
        engine.resume();
      } else {
        engine.resume();
        isResuming.current = true;
      }
      pacing.dispatch({ type: "RESUME" });
    },
    onPause: () => {
      engine.pause();
      if (cascade.state.isRunning) cascade.pauseCascade();
      pacing.dispatch({ type: "PAUSE" });
    },
    onNext: () => handleNext(),
    onPrevious: () => pacing.dispatch({ type: "GO_BACK" }),
    onSeek: (p: number) => seekRef.current?.(p),
  }, coreProgress.totalCoreDuration, coreProgress.elapsedCoreDuration,
  !showAbandon && pacing.state !== "COMPLETE" && pacing.state !== "LOADING");

  // Abandon tracking
  useAbandonTracking(
    useCallback(() => ({
      state: pacing.state,
      stepId: currentStep?.step_id ?? "",
      audioPosition: engine.getCurrentTime(),
    }), [pacing.state, currentStep, engine])
  );

  // Boundary detection — fires when current chunk ends
  const onBoundary = useCallback(() => {
    pacing.dispatch({ type: "CHUNK_END" });
  }, [pacing]);

  useBoundaryDetector(
    engine.audioRef.current,
    pacing.state === "PLAYING" ? pacing.currentEndTime : null,
    pacing.state === "PLAYING" && pacing.currentChunk ? pacing.currentChunk.start_time : null,
    onBoundary
  );

  // React to state changes
  useEffect(() => {
    if (pacing.state === "PLAYING" && pacing.currentChunk) {
      if (isResuming.current) {
        // Resume from current position, don't seek
        isResuming.current = false;
        engine.resume();
      } else {
        engine.playFrom(pacing.currentChunk.start_time, pacing.currentChunk.end_time);
      }
      if (pacing.stepIndex === 0 && pacing.chunkIndex === 0) {
        track("phase_start", {
          phase_index: pacing.phaseIndex,
          phase_name: currentPhase?.phase_name,
        });
      }
    }

    if (pacing.state === "SEAM") {
      engine.pause();
      seamTimerRef.current = setTimeout(() => {
        pacing.dispatch({ type: "SEAM_ELAPSED" });
      }, timing.seamMs);
    }

    if (pacing.state === "WAITING" || pacing.state === "PHASE_GATE") {
      // Only start cascade if not already running (e.g., resuming from pause)
      if (!cascade.isRunning()) {
        engine.pause();
        const gate = currentStep?.gate;
        if (gate) {
          track("gate_enter", { step_id: currentStep.step_id });
          cascade.start(
            gate.cascade,
            (start, end) => engine.playFrom(start, end),
            () => engine.fadeOut(),
            () => engine.pause(),
            () => engine.getCurrentTime()
          );
        }
      }
    }

    if (pacing.state === "COMPLETE") {
      engine.suspendContext();
      cascade.interrupt();
      track("session_complete", { recipe_title: plan.recipe.title, creator: plan.recipe.creator });
    }

    return () => {
      if (seamTimerRef.current) clearTimeout(seamTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacing.state, pacing.phaseIndex, pacing.stepIndex, pacing.chunkIndex]);

  // Handlers
  const handleStart = useCallback(async () => {
    setIsInitializing(true);
    track("session_start", {});
    await engine.init();
    setIsInitializing(false);
    setShowOnboarding(true);
  }, [engine, track]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    pacing.dispatch({ type: "START" });
  }, [pacing]);

  const handlePause = useCallback(() => {
    engine.pause();
    if (cascade.state.isRunning) cascade.pauseCascade();
    pacing.dispatch({ type: "PAUSE" });
  }, [engine, cascade, pacing]);

  const handleResume = useCallback(() => {
    const prevState = pacing.previousState;
    // Always try cascade resume — returns true if audio was mid-playback
    const cascadeWasPlaying = cascade.resumeCascade();
    if (cascadeWasPlaying) {
      engine.resume();
    } else if (prevState === "PLAYING" || prevState === "SEAM") {
      isResuming.current = true;
    }
    pacing.dispatch({ type: "RESUME" });
  }, [cascade, pacing, engine]);

  const handleBack = useCallback(async () => {
    const effective = pacing.state === "PAUSED" ? pacing.previousState : pacing.state;
    if (effective === "WAITING" || effective === "PHASE_GATE") {
      const elapsed = cascade.getEntryElapsedMs();
      if (elapsed > 3000) {
        // Deep into the entry — replay current heartbeat/elastic
        track("step_back", { from_phase: pacing.phaseIndex, from_step: currentStep?.step_id, action: "replay_cascade" });
        if (pacing.state === "PAUSED") pacing.dispatch({ type: "RESUME" });
        await cascade.replay();
        return;
      }
      // Early in entry — go to previous step via NAVIGATE (not GO_BACK,
      // which gets confused by chunkIndex during WAITING)
      await cascade.interrupt();
      track("step_back", { from_phase: pacing.phaseIndex, from_step: currentStep?.step_id, action: "prev_step" });
      if (pacing.stepIndex > 0) {
        pacing.dispatch({ type: "NAVIGATE", phaseIndex: pacing.phaseIndex, stepIndex: pacing.stepIndex - 1 });
      } else if (pacing.phaseIndex > 0) {
        const prevPhase = plan.phases[pacing.phaseIndex - 1];
        pacing.dispatch({ type: "NAVIGATE", phaseIndex: pacing.phaseIndex - 1, stepIndex: prevPhase.steps.length - 1 });
      } else {
        // First step of first phase — replay current step
        pacing.dispatch({ type: "NAVIGATE", phaseIndex: 0, stepIndex: 0 });
      }
      return;
    }
    engine.pause();
    if (cascade.state.isRunning) await cascade.interrupt();
    track("step_back", {
      from_phase: pacing.phaseIndex,
      from_step: currentStep?.step_id,
    });
    pacing.dispatch({ type: "GO_BACK" });
  }, [engine, cascade, pacing, track, currentStep, plan]);

  const handleRepeat = useCallback(async () => {
    const effective = pacing.state === "PAUSED" ? pacing.previousState : pacing.state;
    if (effective === "WAITING" || effective === "PHASE_GATE") {
      track("step_repeat", { step_id: currentStep?.step_id, action: "replay_cascade" });
      if (pacing.state === "PAUSED") {
        pacing.dispatch({ type: "RESUME" });
      }
      await cascade.replay();
      return;
    }
    // Seek to start of current step's first chunk and play
    const step = plan.phases[pacing.phaseIndex]?.steps[pacing.stepIndex];
    const firstChunk = step?.core_chunks[0];
    if (firstChunk) {
      engine.playFrom(firstChunk.start_time, firstChunk.end_time);
    }
    track("step_repeat", { step_id: currentStep?.step_id });
    pacing.dispatch({ type: "REPEAT" });
  }, [engine, pacing, plan, track, currentStep, cascade]);

  const handleNavigate = useCallback(async (phaseIndex: number, stepIndex: number) => {
    engine.pause();
    if (cascade.state.isRunning) await cascade.interrupt();
    track("step_navigate", {
      from_phase: pacing.phaseIndex,
      from_step: pacing.stepIndex,
      to_phase: phaseIndex,
      to_step: stepIndex,
      to_step_id: plan.phases[phaseIndex]?.steps[stepIndex]?.step_id,
    });
    pacing.dispatch({ type: "NAVIGATE", phaseIndex, stepIndex });
  }, [engine, cascade, pacing, track, plan]);

  const handleSeek = useCallback((progress: number) => {
    const target = coreProgress.resolveSeek(progress);
    if (!target) return;
    engine.pause();
    if (cascade.state.isRunning) cascade.interrupt();
    // Navigate to the chunk and seek within it
    pacing.dispatch({
      type: "NAVIGATE_CHUNK",
      phaseIndex: target.phaseIndex,
      stepIndex: target.stepIndex,
      chunkIndex: target.chunkIndex,
    });
    // After state update, playFrom will be called by the effect — but we need
    // to seek to the exact audioTime, not chunk start. Use a microtask to override.
    setTimeout(() => {
      const audio = engine.audioRef.current;
      if (audio) {
        audio.currentTime = target.audioTime;
        audio.play();
      }
    }, 50);
  }, [coreProgress, engine, cascade, pacing]);

  // Keep ref in sync for Media Session seek handler
  seekRef.current = handleSeek;

  const handleRestart = useCallback(() => {
    engine.suspendContext();
    cascade.interrupt();
    setShowAbandon(false);
    pacing.dispatch({ type: "RESTART" });
  }, [engine, cascade, pacing]);

  const handleEndSession = useCallback(() => {
    engine.suspendContext();
    if (cascade.isRunning()) cascade.pauseCascade();
    pacing.dispatch({ type: "PAUSE" });
    setShowAbandon(true);
  }, [engine, cascade, pacing]);

  const handleResumeFromAbandon = useCallback(() => {
    setShowAbandon(false);
    handleResume();
  }, [handleResume]);

  // Render based on state
  if (showOnboarding) {
    return <OnboardingInterstitial plan={plan} onComplete={handleOnboardingComplete} />;
  }

  if (showAbandon) {
    return (
      <AbandonFeedbackScreen
        plan={plan}
        lastStepId={currentStep?.step_id ?? ""}
        phaseIndex={pacing.phaseIndex}
        stepIndex={pacing.stepIndex}
        onResume={handleResumeFromAbandon}
        onRestart={handleRestart}
      />
    );
  }
  switch (pacing.state) {
    case "LOADING":
      return <PreCookScreen plan={plan} onStart={handleStart} isInitializing={isInitializing} preloadProgress={engine.preloadProgress} />;

    case "PLAYING":
    case "SEAM":
      return (
        <CookScreen
          plan={plan}
          currentPhase={currentPhase}
          currentStep={currentStep}
          isPaused={false}
          phaseIndex={pacing.phaseIndex}
          analyser={engine.analyserRef.current}
          coreProgress={coreProgress}
          onNext={handleNext}
          onPause={handlePause}
          onResume={handleResume}
          onBack={handleBack}
          onRepeat={handleRepeat}
          onNavigate={handleNavigate}
          onSeek={handleSeek}
          onSpeedChange={isIOSRef.current ? undefined : handleSpeedChange}
          currentSpeed={playbackSpeed}
          onExit={handleRestart}
          onEnd={handleEndSession}
        />
      );

    case "PAUSED": {
      // Show the correct screen based on what was playing before pause
      const prev = pacing.previousState;
      if (prev === "WAITING" || prev === "PHASE_GATE") {
        return (
          <GateScreen
            plan={plan}
            currentPhase={currentPhase}
            currentStep={currentStep}
            isPhaseGate={prev === "PHASE_GATE"}
            nextPhaseName={
              prev === "PHASE_GATE"
                ? plan.phases[pacing.phaseIndex + 1]?.phase_name
                : undefined
            }
            phaseIndex={pacing.phaseIndex}
            cascadeStatus={cascade.state.statusText}
            cascadeIsPlayingAudio={false}
            analyser={engine.analyserRef.current}
            onNext={handleNext}
            onPause={handlePause}
            onNavigate={handleNavigate}
            onSpeedChange={isIOSRef.current ? undefined : handleSpeedChange}
            currentSpeed={playbackSpeed}
            isPaused={true}
            onResume={handleResume}
            onExit={handleRestart}
            onEnd={handleEndSession}
            onBack={handleBack}
            onRepeat={handleRepeat}
          />
        );
      }
      return (
        <CookScreen
          plan={plan}
          currentPhase={currentPhase}
          currentStep={currentStep}
          isPaused={true}
          phaseIndex={pacing.phaseIndex}
          analyser={engine.analyserRef.current}
          coreProgress={coreProgress}
          onNext={handleNext}
          onPause={handlePause}
          onResume={handleResume}
          onBack={handleBack}
          onRepeat={handleRepeat}
          onNavigate={handleNavigate}
          onSeek={handleSeek}
          onSpeedChange={isIOSRef.current ? undefined : handleSpeedChange}
          currentSpeed={playbackSpeed}
          onExit={handleRestart}
          onEnd={handleEndSession}
        />
      );
    }

    case "WAITING":
    case "PHASE_GATE":
      return (
        <GateScreen
          plan={plan}
          currentPhase={currentPhase}
          currentStep={currentStep}
          isPhaseGate={pacing.state === "PHASE_GATE"}
          nextPhaseName={
            pacing.state === "PHASE_GATE"
              ? plan.phases[pacing.phaseIndex + 1]?.phase_name
              : undefined
          }
          phaseIndex={pacing.phaseIndex}
          cascadeStatus={cascade.state.statusText}
          cascadeIsPlayingAudio={cascade.state.isPlayingAudio}
          analyser={engine.analyserRef.current}
          onNext={handleNext}
          onPause={handlePause}
          onNavigate={handleNavigate}
          onSpeedChange={isIOSRef.current ? undefined : handleSpeedChange}
          currentSpeed={playbackSpeed}
          onExit={handleRestart}
          onEnd={handleEndSession}
          onBack={handleBack}
          onRepeat={handleRepeat}
        />
      );

    case "COMPLETE":
      return <CompleteScreen plan={plan} onRestart={handleRestart} />;

    default:
      return null;
  }
}
