"use client";

import Image from "next/image";
import type { PlaybackPlan, Phase, Step } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TransportControls } from "./TransportControls";
import { Waveform } from "./Waveform";
import { StepNavigator } from "./StepNavigator";

export function CookScreen({
  plan,
  currentPhase,
  currentStep,
  isPaused,
  phaseIndex,
  analyser,
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
  analyser: AnalyserNode | null;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
  onRepeat: () => void;
  onNavigate: (phaseIndex: number, stepIndex: number) => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#2A231D] px-5 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <ProgressBar
            phases={plan.phases}
            currentPhaseIndex={phaseIndex}
            stepsInPhase={currentPhase.steps.indexOf(currentStep)}
          />
        </div>
      </div>

      {/* Phase label */}
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
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

        {/* Step progress in phase */}
        <p className="mt-1 text-[11px] text-[#5C5347]">
          Step {currentPhase.steps.indexOf(currentStep) + 1} of {currentPhase.steps.length}
        </p>
      </div>

      {/* Step navigator */}
      <StepNavigator
        plan={plan}
        currentPhaseIndex={phaseIndex}
        currentStepIndex={currentPhase.steps.indexOf(currentStep)}
        onNavigate={onNavigate}
      />

      {/* Transport */}
      <div className="pb-4 pt-4">
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
