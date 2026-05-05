"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PlaybackPlan } from "@/lib/types";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePacingMachine } from "@/hooks/usePacingMachine";
import { useBoundaryDetector } from "@/hooks/useBoundaryDetector";
import { useCascadeSequencer } from "@/hooks/useCascadeSequencer";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAnalytics, useAbandonTracking } from "@/hooks/useAnalytics";
import { timing } from "@/lib/constants";
import { PreCookScreen } from "./PreCookScreen";
import { CookScreen } from "./CookScreen";
import { GateScreen } from "./GateScreen";
import { CompleteScreen } from "./CompleteScreen";

export function CookalongPlayer({ plan }: { plan: PlaybackPlan }) {
  const engine = useAudioEngine(plan.recipe.audio_url);
  const pacing = usePacingMachine(plan);
  const cascade = useCascadeSequencer();
  const { track } = useAnalytics();
  const seamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResuming = useRef(false);

  const currentPhase = plan.phases[pacing.phaseIndex];
  const currentStep = currentPhase?.steps[pacing.stepIndex];

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
      pacing.dispatch({ type: "ADVANCE" });
    }
  }, [pacing, cascade, engine, currentStep, track]);

  useMediaSession(plan, {
    onPlay: () => pacing.dispatch({ type: "RESUME" }),
    onPause: () => pacing.dispatch({ type: "PAUSE" }),
    onNext: () => handleNext(),
    onPrevious: () => pacing.dispatch({ type: "GO_BACK" }),
  });

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
    }

    if (pacing.state === "SEAM") {
      seamTimerRef.current = setTimeout(() => {
        pacing.dispatch({ type: "SEAM_ELAPSED" });
      }, timing.seamMs);
    }

    if (pacing.state === "WAITING" || pacing.state === "PHASE_GATE") {
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

    return () => {
      if (seamTimerRef.current) clearTimeout(seamTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacing.state, pacing.phaseIndex, pacing.stepIndex, pacing.chunkIndex]);

  // Handlers
  const handleStart = useCallback(async () => {
    track("session_start", {});
    await engine.init();
    pacing.dispatch({ type: "START" });
  }, [engine, pacing, track]);

  const handlePause = useCallback(() => {
    engine.pause();
    if (cascade.state.isRunning) cascade.pauseCascade();
    pacing.dispatch({ type: "PAUSE" });
  }, [engine, cascade, pacing]);

  const handleResume = useCallback(() => {
    if (cascade.state.isRunning) cascade.resumeCascade();
    isResuming.current = true;
    pacing.dispatch({ type: "RESUME" });
  }, [cascade, pacing]);

  const handleBack = useCallback(() => {
    engine.pause();
    if (cascade.state.isRunning) cascade.interrupt();
    pacing.dispatch({ type: "GO_BACK" });
  }, [engine, cascade, pacing]);

  const handleRepeat = useCallback(() => {
    engine.pause();
    pacing.dispatch({ type: "REPEAT" });
  }, [engine, pacing]);

  const handleNavigate = useCallback(async (phaseIndex: number, stepIndex: number) => {
    engine.pause();
    if (cascade.state.isRunning) await cascade.interrupt();
    pacing.dispatch({ type: "NAVIGATE", phaseIndex, stepIndex });
  }, [engine, cascade, pacing]);

  // Render based on state
  switch (pacing.state) {
    case "LOADING":
      return <PreCookScreen plan={plan} onStart={handleStart} />;

    case "PLAYING":
    case "SEAM":
    case "PAUSED":
      return (
        <CookScreen
          plan={plan}
          currentPhase={currentPhase}
          currentStep={currentStep}
          isPaused={pacing.state === "PAUSED"}
          phaseIndex={pacing.phaseIndex}
          analyser={engine.analyserRef.current}
          onNext={handleNext}
          onPause={handlePause}
          onResume={handleResume}
          onBack={handleBack}
          onRepeat={handleRepeat}
          onNavigate={handleNavigate}
        />
      );

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
        />
      );

    case "COMPLETE":
      return <CompleteScreen plan={plan} />;

    default:
      return null;
  }
}
