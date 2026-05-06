"use client";

import Image from "next/image";
import type { PlaybackPlan, Phase, Step } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TransportControls } from "./TransportControls";
import { Waveform } from "./Waveform";
import { StepNavigator } from "./StepNavigator";
import { ShareButton } from "./ShareButton";

export function GateScreen({
  plan,
  currentPhase,
  currentStep,
  isPhaseGate,
  nextPhaseName,
  phaseIndex,
  cascadeStatus,
  cascadeIsPlayingAudio,
  analyser,
  onNext,
  onPause,
  onNavigate,
  onSpeedChange,
  currentSpeed,
  isPaused = false,
  onResume,
  onExit,
  onEnd,
  onBack,
  onRepeat,
}: {
  plan: PlaybackPlan;
  currentPhase: Phase;
  currentStep: Step;
  isPhaseGate: boolean;
  nextPhaseName?: string;
  phaseIndex: number;
  cascadeStatus: string;
  cascadeIsPlayingAudio?: boolean;
  analyser: AnalyserNode | null;
  onNext: () => void;
  onPause: () => void;
  onNavigate: (phaseIndex: number, stepIndex: number) => void;
  onSpeedChange?: (speed: number) => void;
  currentSpeed: number;
  isPaused?: boolean;
  onResume?: () => void;
  onExit: () => void;
  onEnd?: () => void;
  onBack?: () => void;
  onRepeat?: () => void;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden flex-col bg-[#2A231D] px-5 py-6">
      {/* Top bar */}
      <div>
        <ProgressBar
          phases={plan.phases}
          currentPhaseIndex={phaseIndex}
          stepsInPhase={currentPhase.steps.indexOf(currentStep) + 1}
          onNavigate={onNavigate}
        />
      </div>

      {/* Share + phase label + exit */}
      {/* Phase label + actions */}
      <div className="mt-3 flex items-center justify-between">
        <ShareButton variant="dark" />
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
          {currentPhase.phase_name}
        </p>
        <div className="flex items-center gap-3">
          {onEnd && (
            <button
              onClick={onEnd}
              className="cursor-pointer text-[11px] text-[#5C5347] transition-colors hover:text-[#887B6C]"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* Center content */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Creator photo with honey border */}
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-[2px] border-[#C9944A]">
          <Image
            src={plan.recipe.creator_photo_url}
            alt={plan.recipe.creator}
            fill
            className="object-cover"
          />
        </div>

        {/* Audio waveform when cascade is playing */}
        {cascadeIsPlayingAudio && (
          <div className="mt-3">
            <Waveform analyser={analyser} active={true} barCount={11} color="#C9944A" />
          </div>
        )}

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
        <p className="mt-4 text-center text-[14px] italic text-[#EDE6DD]">
          {cascadeStatus || "Take your time..."}
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
          onBack={onBack ?? (() => {})}
          onRepeat={onRepeat ?? (() => {})}
          onPause={onPause}
          onResume={onResume ?? (() => {})}
          onNext={onNext}
          onSpeedChange={onSpeedChange}
          currentSpeed={currentSpeed}
        />
      </div>

    </div>
  );
}
