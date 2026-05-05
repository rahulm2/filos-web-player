"use client";

import { useState, useEffect, useRef } from "react";
import type { PlaybackPlan } from "@/lib/types";

export function StepNavigator({
  plan,
  currentPhaseIndex,
  currentStepIndex,
  onNavigate,
}: {
  plan: PlaybackPlan;
  currentPhaseIndex: number;
  currentStepIndex: number;
  onNavigate: (phaseIndex: number, stepIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (expanded && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [expanded, currentPhaseIndex, currentStepIndex]);

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mx-auto flex cursor-pointer items-center gap-1 text-[12px] text-[#887B6C] transition-colors hover:text-[#C9944A]"
      >
        {expanded ? "Hide recipe" : "View recipe steps"}{" "}
        <span className="text-[10px]">{expanded ? "\u25B4" : "\u25BE"}</span>
      </button>

      {expanded && (
        <div className="mt-3 max-h-[240px] overflow-y-auto rounded-lg bg-[#443B31] p-3">
          {plan.phases.map((phase, pi) => (
            <div key={phase.phase_number} className="mb-3 last:mb-0">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#C9944A]">
                {phase.phase_name}
              </p>
              <div className="mt-1 space-y-0.5">
                {phase.steps.map((step, si) => {
                  const isCurrent = pi === currentPhaseIndex && si === currentStepIndex;
                  const isPast =
                    pi < currentPhaseIndex ||
                    (pi === currentPhaseIndex && si < currentStepIndex);

                  return (
                    <button
                      key={step.step_id}
                      ref={isCurrent ? currentRef : undefined}
                      onClick={() => onNavigate(pi, si)}
                      className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#C9944A]/10 active:scale-[0.98] ${
                        isCurrent ? "bg-[#C9944A]/20" : ""
                      }`}
                    >
                      {/* Status indicator */}
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isPast ? (
                          <span className="text-[10px] text-[#6B917A]">&#10003;</span>
                        ) : isCurrent ? (
                          <div className="h-2 w-2 rounded-full bg-[#C9944A]" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-[#5C5347]" />
                        )}
                      </div>

                      {/* Step label */}
                      <span
                        className={`text-[12px] leading-tight ${
                          isCurrent
                            ? "font-medium text-[#F5F0EB]"
                            : isPast
                            ? "text-[#887B6C]"
                            : "text-[#887B6C]"
                        }`}
                      >
                        {step.step_label}
                      </span>

                      {/* Gated indicator */}
                      {step.pacing === "gated" && !isPast && (
                        <span className="ml-auto shrink-0 text-[9px] text-[#5C5347]">
                          tap
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
