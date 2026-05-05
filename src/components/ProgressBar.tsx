"use client";

import { useState } from "react";
import type { Phase } from "@/lib/types";

export function ProgressBar({
  phases,
  currentPhaseIndex,
  stepsInPhase,
  onNavigate,
}: {
  phases: Phase[];
  currentPhaseIndex: number;
  stepsInPhase?: number;
  onNavigate?: (phaseIndex: number, stepIndex: number) => void;
}) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const handlePhaseClick = (phaseIdx: number) => {
    if (!onNavigate) return;
    if (expandedPhase === phaseIdx) {
      setExpandedPhase(null);
    } else {
      setExpandedPhase(phaseIdx);
    }
  };

  const handleStepClick = (phaseIdx: number, stepIdx: number) => {
    if (!onNavigate) return;
    onNavigate(phaseIdx, stepIdx);
    setExpandedPhase(null);
  };

  return (
    <div>
      {/* Phase segments */}
      <div className="flex gap-[2px]">
        {phases.map((phase, i) => {
          const isComplete = i < currentPhaseIndex;
          const isCurrent = i === currentPhaseIndex;
          const progress = isCurrent && stepsInPhase !== undefined
            ? Math.min(100, (stepsInPhase / phase.steps.length) * 100)
            : 0;

          return (
            <button
              key={i}
              onClick={() => handlePhaseClick(i)}
              className={`relative h-[4px] flex-1 rounded-full ${onNavigate ? "cursor-pointer" : ""} ${
                isComplete ? "bg-[#C9944A]" : isCurrent ? "bg-[#C9944A]/30" : "bg-[#DDD5CB]"
              }`}
              aria-label={`${phase.phase_name} — ${isComplete ? "complete" : isCurrent ? "in progress" : "upcoming"}`}
            >
              {isCurrent && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#C9944A]"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Phase labels */}
      <div className="mt-1.5 flex">
        {phases.map((phase, i) => {
          const isCurrent = i === currentPhaseIndex;
          return (
            <button
              key={i}
              onClick={() => handlePhaseClick(i)}
              className={`flex-1 text-center text-[9px] transition-colors ${
                onNavigate ? "cursor-pointer hover:text-[#C9944A]" : ""
              } ${isCurrent ? "font-medium text-[#C9944A]" : "text-[#887B6C]"}`}
            >
              {phase.phase_name}
            </button>
          );
        })}
      </div>

      {/* Step dropdown when a phase is tapped */}
      {expandedPhase !== null && onNavigate && (
        <div className="mt-2 rounded-lg bg-[#443B31] p-2">
          <div className="space-y-0.5">
            {phases[expandedPhase].steps.map((step, si) => {
              const isCurrent = expandedPhase === currentPhaseIndex && si === (stepsInPhase ?? 0);
              const isPast = expandedPhase < currentPhaseIndex ||
                (expandedPhase === currentPhaseIndex && si < (stepsInPhase ?? 0));

              return (
                <button
                  key={step.step_id}
                  onClick={() => handleStepClick(expandedPhase, si)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#C9944A]/10 active:scale-[0.98] ${
                    isCurrent ? "bg-[#C9944A]/20" : ""
                  }`}
                >
                  <div className="flex h-3 w-3 shrink-0 items-center justify-center">
                    {isPast ? (
                      <span className="text-[8px] text-[#6B917A]">&#10003;</span>
                    ) : isCurrent ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-[#C9944A]" />
                    ) : (
                      <div className="h-1 w-1 rounded-full bg-[#5C5347]" />
                    )}
                  </div>
                  <span className={`text-[11px] leading-tight ${
                    isCurrent ? "text-[#F5F0EB]" : "text-[#887B6C]"
                  }`}>
                    {step.step_label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
