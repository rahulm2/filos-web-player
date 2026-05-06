"use client";

import { useState, useEffect, useRef } from "react";
import type { PlaybackPlan } from "@/lib/types";

type Tab = "steps" | "ingredients" | null;

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
  const [activeTab, setActiveTab] = useState<Tab>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTab === "steps" && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeTab, currentPhaseIndex, currentStepIndex]);

  const toggleTab = (tab: "steps" | "ingredients") => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div className="mt-3">
      {/* Content panel — renders above the segmented control */}
      {activeTab === "steps" && (
        <div className="mb-2.5 max-h-[220px] overflow-y-auto rounded-xl border border-[#5C5347]/40 bg-[#352E27] p-3">
          {plan.phases.map((phase, pi) => (
            <div key={phase.phase_number} className="mb-3 last:mb-0">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#C9944A]">
                {phase.phase_name}
              </p>
              <div className="mt-1.5 space-y-0.5">
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
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#F5F0EB]/5 active:scale-[0.98] ${
                        isCurrent ? "bg-[#F5F0EB]/8" : ""
                      }`}
                    >
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isPast ? (
                          <span className="text-[11px] text-[#6B917A]">&#10003;</span>
                        ) : isCurrent ? (
                          <div className="h-[7px] w-[7px] rounded-full bg-[#F5F0EB]" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-[#5C5347]" />
                        )}
                      </div>
                      <span
                        className={`text-[13px] leading-snug ${
                          isCurrent
                            ? "font-medium text-[#F5F0EB]"
                            : isPast
                            ? "text-[#887B6C]"
                            : "text-[#B0A89D]"
                        }`}
                      >
                        {step.step_label}
                      </span>
                      {step.pacing === "gated" && !isPast && (
                        <span className="ml-auto shrink-0 rounded bg-[#5C5347]/40 px-1.5 py-0.5 text-[9px] text-[#887B6C]">
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

      {activeTab === "ingredients" && (
        <div className="mb-2.5 max-h-[260px] overflow-y-auto rounded-xl border border-[#5C5347]/40 bg-[#352E27] p-3">
          <div className="space-y-0">
            {plan.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between border-b border-[#5C5347]/20 py-2.5"
              >
                <span className="text-[13px] text-[#F5F0EB]">{ing.name}</span>
                <span className="shrink-0 pl-4 text-[12px] text-[#B0A89D]">{ing.quantity}</span>
              </div>
            ))}
          </div>

          {plan.substitutions.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[12px] font-medium text-[#C9944A]">
                Substitutions
              </summary>
              <div className="mt-2 space-y-2">
                {plan.substitutions.map((sub, i) => (
                  <div key={i} className="text-[12px]">
                    <span className="text-[#887B6C]">{sub.ingredient}</span>
                    <span className="text-[#DDD5CB]"> &rarr; {sub.substitute}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {plan.equipment.length > 0 && (
            <div className="mt-3 border-t border-[#5C5347]/20 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#887B6C]">
                Gear
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#DDD5CB]">
                {plan.equipment.join(" \u00B7 ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Segmented control */}
      <div className="flex items-center justify-center">
        <div className="flex rounded-lg bg-[#352E27] p-0.5">
          <button
            onClick={() => toggleTab("steps")}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-[12px] font-medium transition-all ${
              activeTab === "steps"
                ? "bg-[#F5F0EB] text-[#2A231D]"
                : "text-[#887B6C] hover:text-[#F5F0EB]"
            }`}
          >
            Steps
          </button>
          <button
            onClick={() => toggleTab("ingredients")}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-[12px] font-medium transition-all ${
              activeTab === "ingredients"
                ? "bg-[#F5F0EB] text-[#2A231D]"
                : "text-[#887B6C] hover:text-[#F5F0EB]"
            }`}
          >
            Ingredients
          </button>
        </div>
      </div>
    </div>
  );
}
