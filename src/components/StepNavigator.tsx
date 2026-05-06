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
    <div className="mt-4">
      {/* Tab buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => toggleTab("steps")}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            activeTab === "steps"
              ? "bg-[#C9944A]/20 text-[#C9944A]"
              : "text-[#887B6C] hover:text-[#C9944A]"
          }`}
        >
          Steps
        </button>
        <button
          onClick={() => toggleTab("ingredients")}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            activeTab === "ingredients"
              ? "bg-[#C9944A]/20 text-[#C9944A]"
              : "text-[#887B6C] hover:text-[#C9944A]"
          }`}
        >
          Ingredients
        </button>
      </div>

      {/* Steps panel */}
      {activeTab === "steps" && (
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
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isPast ? (
                          <span className="text-[10px] text-[#6B917A]">&#10003;</span>
                        ) : isCurrent ? (
                          <div className="h-2 w-2 rounded-full bg-[#C9944A]" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-[#5C5347]" />
                        )}
                      </div>
                      <span
                        className={`text-[12px] leading-tight ${
                          isCurrent
                            ? "font-medium text-[#F5F0EB]"
                            : "text-[#887B6C]"
                        }`}
                      >
                        {step.step_label}
                      </span>
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

      {/* Ingredients panel */}
      {activeTab === "ingredients" && (
        <div className="mt-3 max-h-[280px] overflow-y-auto rounded-lg bg-[#443B31] p-3">
          {/* Ingredient list */}
          <div className="space-y-0">
            {plan.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-[#5C5347]/30 py-2"
              >
                <span className="text-[12px] text-[#F5F0EB]">{ing.name}</span>
                <span className="shrink-0 pl-3 text-[11px] text-[#887B6C]">{ing.quantity}</span>
              </div>
            ))}
          </div>

          {/* Substitutions */}
          {plan.substitutions.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] font-medium text-[#C9944A]">
                Substitutions
              </summary>
              <div className="mt-2 space-y-1.5">
                {plan.substitutions.map((sub, i) => (
                  <div key={i} className="text-[11px]">
                    <span className="text-[#887B6C]">{sub.ingredient}</span>
                    <span className="text-[#DDD5CB]"> &rarr; {sub.substitute}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Gear */}
          {plan.equipment.length > 0 && (
            <div className="mt-3 border-t border-[#5C5347]/30 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#887B6C]">
                Gear
              </p>
              <p className="mt-1.5 text-[11px] text-[#DDD5CB]">
                {plan.equipment.join(" \u00B7 ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
