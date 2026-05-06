"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlaybackPlan } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";

export function AbandonFeedbackScreen({
  plan,
  lastStepId,
  phaseIndex,
  stepIndex,
  onResume,
  onRestart,
}: {
  plan: PlaybackPlan;
  lastStepId: string;
  phaseIndex: number;
  stepIndex: number;
  onResume: () => void;
  onRestart: () => void;
}) {
  const { track } = useAnalytics();
  const [reason, setReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const creatorFirst = plan.recipe.creator.split(" ")[0];

  const totalSteps = plan.phases.reduce((sum, p) => sum + p.steps.length, 0);
  const completedSteps = plan.phases.slice(0, phaseIndex).reduce((sum, p) => sum + p.steps.length, 0) + stepIndex;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const reasons = [
    "Got confused",
    "Too slow / too fast",
    "Had to step away",
    "Recipe wasn't for me",
    "Just exploring",
  ];

  const handleSubmit = (selectedReason: string) => {
    setReason(selectedReason);
    setSubmitted(true);
    track("session_abandon_feedback", {
      reason: selectedReason,
      last_step_id: lastStepId,
      phase_index: phaseIndex,
      step_index: stepIndex,
      progress_pct: progressPct,
      recipe: plan.recipe.title,
      creator: plan.recipe.creator,
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#2A231D] px-5 py-8">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center justify-center">
        {/* Creator photo */}
        <div className="relative h-12 w-12 overflow-hidden rounded-full">
          <Image
            src={plan.recipe.creator_photo_url}
            alt={plan.recipe.creator}
            fill
            className="object-cover"
          />
        </div>

        {!submitted ? (
          <>
            <h2 className="mt-5 text-center font-[family-name:var(--font-fraunces)] text-[20px] text-[#F5F0EB]">
              Leaving already?
            </h2>
            <p className="mt-1.5 text-center text-[13px] text-[#887B6C]">
              You&apos;re {progressPct}% through. Quick &mdash; what happened?
            </p>

            <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSubmit(r)}
                  className={`cursor-pointer rounded-full border px-3.5 py-2 text-[12px] transition-colors hover:border-[#C9944A] hover:text-[#C9944A] active:scale-[0.97] ${
                    reason === r
                      ? "border-[#C9944A] text-[#C9944A]"
                      : "border-[#5C5347] text-[#DDD5CB]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Resume CTA */}
            <button
              onClick={onResume}
              className="mt-8 cursor-pointer rounded-[10px] bg-[#C9944A] px-8 py-3 text-[14px] font-medium text-[#2A231D] transition-all hover:bg-[#D4A45B] active:scale-[0.97]"
            >
              Keep cooking with {creatorFirst}
            </button>

            <button
              onClick={() => handleSubmit("skipped")}
              className="mt-3 cursor-pointer text-[12px] text-[#887B6C] transition-colors hover:text-[#DDD5CB]"
            >
              Skip &amp; leave
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-center font-[family-name:var(--font-fraunces)] text-[20px] text-[#F5F0EB]">
              Thanks for letting us know
            </h2>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onResume}
                className="cursor-pointer rounded-[10px] border border-[#C9944A] px-5 py-2.5 text-[13px] font-medium text-[#C9944A] transition-all hover:bg-[#C9944A]/10 active:scale-[0.97]"
              >
                Resume cooking
              </button>
              <button
                onClick={onRestart}
                className="cursor-pointer rounded-[10px] border border-[#5C5347] px-5 py-2.5 text-[13px] text-[#887B6C] transition-all hover:border-[#887B6C] hover:text-[#DDD5CB] active:scale-[0.97]"
              >
                Start over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
