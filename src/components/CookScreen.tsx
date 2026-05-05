"use client";

import Image from "next/image";
import type { PlaybackPlan, Phase, Step } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TransportControls } from "./TransportControls";
import { Waveform } from "./Waveform";
import { StepNavigator } from "./StepNavigator";
import { ShareButton } from "./ShareButton";
import { Scrubber } from "./Scrubber";

interface CoreProgressData {
  progress: number;
  elapsedFormatted: string;
  remainingFormatted: string;
}

export function CookScreen({
  plan,
  currentPhase,
  currentStep,
  isPaused,
  phaseIndex,
  analyser,
  coreProgress,
  onNext,
  onPause,
  onResume,
  onBack,
  onRepeat,
  onNavigate,
  onSeek,
  onSpeedChange,
  currentSpeed,
}: {
  plan: PlaybackPlan;
  currentPhase: Phase;
  currentStep: Step;
  isPaused: boolean;
  phaseIndex: number;
  analyser: AnalyserNode | null;
  coreProgress: CoreProgressData;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
  onRepeat: () => void;
  onNavigate: (phaseIndex: number, stepIndex: number) => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: number) => void;
  currentSpeed: number;
}) {
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

      {/* Phase label + share */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
          {currentPhase.phase_name}
        </p>
        <ShareButton variant="dark" />
      </div>

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

      {/* Playback scrubber — tappable and draggable */}
      <Scrubber
        progress={coreProgress.progress}
        elapsedFormatted={coreProgress.elapsedFormatted}
        remainingFormatted={coreProgress.remainingFormatted}
        onSeek={onSeek}
      />

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
          onSpeedChange={onSpeedChange}
          currentSpeed={currentSpeed}
        />
      </div>
    </div>
  );
}
