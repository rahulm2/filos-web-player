"use client";

import type { PlaybackPlan, Phase, Step } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TransportControls } from "./TransportControls";

export function CookScreen({
  plan,
  currentPhase,
  currentStep,
  isPaused,
  phaseIndex,
  onNext,
  onPause,
  onResume,
  onBack,
  onRepeat,
}: {
  plan: PlaybackPlan;
  currentPhase: Phase;
  currentStep: Step;
  isPaused: boolean;
  phaseIndex: number;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
  onRepeat: () => void;
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
        <div className="h-16 w-16 rounded-full bg-[#443B31]" />

        {/* Step label */}
        <h2 className="mt-4 text-center font-[family-name:var(--font-fraunces)] text-[20px] text-[#F5F0EB]">
          {currentStep.step_label}
        </h2>

        {/* Status */}
        <p className="mt-2 text-[13px] text-[#887B6C]">
          {isPaused ? "Paused" : "Listening to Clare..."}
        </p>
      </div>

      {/* Transport */}
      <div className="pb-4">
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
