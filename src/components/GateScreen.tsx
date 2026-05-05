"use client";

import type { PlaybackPlan, Phase, Step } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TransportControls } from "./TransportControls";

export function GateScreen({
  plan,
  currentPhase,
  currentStep,
  isPhaseGate,
  nextPhaseName,
  phaseIndex,
  cascadeStatus,
  onNext,
  onPause,
}: {
  plan: PlaybackPlan;
  currentPhase: Phase;
  currentStep: Step;
  isPhaseGate: boolean;
  nextPhaseName?: string;
  phaseIndex: number;
  cascadeStatus: string;
  onNext: () => void;
  onPause: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#2A231D] px-5 py-6">
      {/* Top bar */}
      <div>
        <ProgressBar
          phases={plan.phases}
          currentPhaseIndex={phaseIndex}
          stepsInPhase={currentPhase.steps.indexOf(currentStep) + 1}
        />
      </div>

      {/* Phase label */}
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
        {currentPhase.phase_name}
      </p>

      {/* Center content */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Creator photo with honey border */}
        <div className="h-16 w-16 rounded-full border-[1.5px] border-[#C9944A] bg-[#443B31]" />

        {/* Gate card */}
        <div className="mt-5 w-full max-w-[300px] rounded-[10px] border-[1.5px] border-[#C9944A] p-4 text-center">
          {isPhaseGate ? (
            <>
              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#6B917A]/20">
                <span className="text-[12px] text-[#6B917A]">&#10003;</span>
              </div>
              <p className="mt-2 text-[13px] text-[#6B917A]">
                {currentPhase.phase_name} complete
              </p>
              <div className="mx-auto my-2 h-5 w-[1px] bg-[#443B31]" />
              <p className="text-[11px] uppercase tracking-[1px] text-[#887B6C]">
                Up next
              </p>
              <p className="mt-1 font-[family-name:var(--font-fraunces)] text-[22px] text-[#F5F0EB]">
                {nextPhaseName}
              </p>
            </>
          ) : (
            <>
              <p className="text-[12px] font-medium uppercase tracking-[1px] text-[#C9944A]">
                Your turn
              </p>
              <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[18px] text-[#F5F0EB]">
                {currentStep.step_label}
              </p>
              {currentStep.instruction && (
                <p className="mt-1 text-[12px] text-[#887B6C]">
                  {currentStep.instruction}
                </p>
              )}
            </>
          )}
        </div>

        {/* Cascade status */}
        <p className="mt-4 text-center text-[13px] italic text-[#5C5347]">
          {cascadeStatus}
        </p>
      </div>

      {/* Transport */}
      <div className="pb-4">
        <TransportControls
          isPaused={false}
          onBack={() => {}}
          onRepeat={() => {}}
          onPause={onPause}
          onResume={() => {}}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
