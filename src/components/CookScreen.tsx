"use client";

import Image from "next/image";
import type { PlaybackPlan, Phase, Step } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TransportControls } from "./TransportControls";
import { Waveform } from "./Waveform";
import { StepNavigator } from "./StepNavigator";
import { useCoreProgress } from "@/hooks/useCoreProgress";

export function CookScreen({
  plan,
  currentPhase,
  currentStep,
  isPaused,
  phaseIndex,
  stepIndex,
  chunkIndex,
  analyser,
  audioRef,
  onNext,
  onPause,
  onResume,
  onBack,
  onRepeat,
  onNavigate,
}: {
  plan: PlaybackPlan;
  currentPhase: Phase;
  currentStep: Step;
  isPaused: boolean;
  phaseIndex: number;
  stepIndex: number;
  chunkIndex: number;
  analyser: AnalyserNode | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
  onRepeat: () => void;
  onNavigate: (phaseIndex: number, stepIndex: number) => void;
}) {
  const coreProgress = useCoreProgress(
    plan, phaseIndex, stepIndex, chunkIndex, audioRef, !isPaused
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#2A231D] px-5 py-6">
      {/* Top bar */}
      <div>
        <ProgressBar
          phases={plan.phases}
          currentPhaseIndex={phaseIndex}
          stepsInPhase={currentPhase.steps.indexOf(currentStep)}
          onNavigate={onNavigate}
        />
      </div>

      {/* Phase label */}
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
        {currentPhase.phase_name}
      </p>

      {/* Center content */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Creator photo */}
        <div className="relative h-16 w-16 overflow-hidden rounded-full">
          <Image
            src={plan.recipe.creator_photo_url}
            alt={plan.recipe.creator}
            fill
            className="object-cover"
          />
        </div>

        {/* Real audio waveform */}
        <div className="mt-4">
          <Waveform analyser={analyser} active={!isPaused} />
        </div>

        {/* Step label */}
        <h2 className="mt-3 text-center font-[family-name:var(--font-fraunces)] text-[20px] text-[#F5F0EB]">
          {currentStep.step_label}
        </h2>

        {/* Status */}
        <p className="mt-2 text-[13px] text-[#887B6C]">
          {isPaused ? "Paused" : "Listening to Clare..."}
        </p>
      </div>

      {/* Playback scrubber */}
      <div className="mb-2">
        <div className="relative h-[3px] w-full rounded-full bg-[#443B31]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#C9944A] transition-[width] duration-200"
            style={{ width: `${coreProgress.progress * 100}%` }}
          />
          {/* Scrubber dot */}
          <div
            className="absolute top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#F5F0EB] shadow-sm transition-[left] duration-200"
            style={{ left: `calc(${coreProgress.progress * 100}% - 5px)` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="text-[10px] tabular-nums text-[#887B6C]">
            {coreProgress.elapsedFormatted}
          </span>
          <span className="text-[10px] tabular-nums text-[#887B6C]">
            {coreProgress.remainingFormatted}
          </span>
        </div>
      </div>

      {/* Step navigator */}
      <StepNavigator
        plan={plan}
        currentPhaseIndex={phaseIndex}
        currentStepIndex={currentPhase.steps.indexOf(currentStep)}
        onNavigate={onNavigate}
      />

      {/* Transport */}
      <div className="pb-4 pt-3">
        <TransportControls
          isPaused={isPaused}
          onBack={onBack}
          onRepeat={onRepeat}
          onPause={onPause}
          onResume={onResume}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
