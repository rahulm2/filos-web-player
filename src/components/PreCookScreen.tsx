"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlaybackPlan } from "@/lib/types";
import { ConfirmationAlert } from "./ConfirmationAlert";
import { ProgressBar } from "./ProgressBar";
import { InstagramPrompt } from "./InstagramPrompt";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ShareButton } from "./ShareButton";

export function PreCookScreen({
  plan,
  onStart,
  isInitializing,
}: {
  plan: PlaybackPlan;
  onStart: () => void;
  isInitializing: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { track } = useAnalytics();

  return (
    <div className="min-h-screen bg-[#F5F0EB] pb-28">
      <div className="mx-auto max-w-[480px] px-5">
        <InstagramPrompt />

        {/* Hero image */}
        <div className="relative -mx-5 h-[200px] overflow-hidden">
          <Image
            src={plan.recipe.recipe_photo_url}
            alt={plan.recipe.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F0EB]" />
        </div>

        {/* Creator photo + header + share */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
            <Image
              src={plan.recipe.creator_photo_url}
              alt={plan.recipe.creator}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
              Cook with
            </p>
            <h1 className="font-[family-name:var(--font-fraunces)] text-[22px] leading-tight text-[#2A231D]">
              {plan.recipe.creator}
            </h1>
          </div>
          <ShareButton variant="light" />
        </div>

        <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-[18px] text-[#2A231D]">
          {plan.recipe.title}
        </h2>

        {/* Metadata chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#EDE6DD] px-3 py-1 text-[12px] text-[#5C5347]">
            ~{plan.recipe.estimated_active_minutes} min
          </span>
          {plan.recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#EDE6DD] px-3 py-1 text-[12px] text-[#5C5347]"
            >
              {tag}
            </span>
          ))}
          <span className="rounded-full bg-[#EDE6DD] px-3 py-1 text-[12px] text-[#5C5347]">
            Serves {plan.recipe.serves}
          </span>
        </div>

        {/* Phase progress */}
        <div className="mt-6">
          <ProgressBar phases={plan.phases} currentPhaseIndex={0} stepsInPhase={0} />
          <div className="mt-1.5 flex justify-between">
            {plan.phases.map((p) => (
              <span key={p.phase_number} className="text-[10px] text-[#887B6C]">
                {p.phase_name}
              </span>
            ))}
          </div>
        </div>

        {/* Recipe steps overview */}
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#887B6C]">
            What you&apos;ll do
          </h3>
          <div className="mt-3 space-y-0">
            {plan.phases.map((phase) => (
              <div key={phase.phase_number} className="mb-3">
                <p className="text-[12px] font-semibold text-[#C9944A]">{phase.phase_name}</p>
                <ol className="mt-1 space-y-1">
                  {phase.steps.map((step, i) => (
                    <li key={step.step_id} className="flex items-start gap-2 text-[13px] text-[#5C5347]">
                      <span className="mt-0.5 text-[10px] text-[#887B6C]">{i + 1}.</span>
                      <span>{step.step_label}</span>
                      {step.pacing === "gated" && (
                        <span className="ml-auto shrink-0 text-[10px] text-[#887B6C]">tap</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#887B6C]">
            Ingredients
          </h3>
          <div className="mt-3 space-y-0">
            {plan.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-[#DDD5CB]/50 py-2.5"
              >
                <span className="text-[14px] text-[#2A231D]">{ing.name}</span>
                <span className="ml-4 shrink-0 text-[13px] text-[#887B6C]">{ing.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Substitutions */}
        <details className="mt-4">
          <summary className="cursor-pointer text-[12px] font-medium text-[#C9944A]">
            Substitutions
          </summary>
          <div className="mt-2 rounded-lg bg-[#EDE6DD] p-3 space-y-2">
            {plan.substitutions.map((sub, i) => (
              <div key={i} className="text-[12px]">
                <span className="text-[#887B6C]">{sub.ingredient}</span>
                <span className="text-[#5C5347]"> &rarr; {sub.substitute}</span>
              </div>
            ))}
          </div>
        </details>

        {/* Gear */}
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#887B6C]">
            Gear
          </h3>
          <p className="mt-2 text-[13px] text-[#5C5347]">
            {plan.equipment.join(" \u00B7 ")}
          </p>
        </div>
      </div>

      {/* Fixed CTA at bottom — pb-[env(safe-area-inset-bottom)] for iPhone notch */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#EDE6DD] bg-[#F5F0EB] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto max-w-[480px]">
          <button
            onClick={() => { track("cta_tapped", { recipe_title: plan.recipe.title, creator: plan.recipe.creator }); setShowConfirm(true); }}
            className="w-full cursor-pointer rounded-[10px] bg-[#2A231D] px-6 py-[14px] text-[15px] font-medium text-[#F5F0EB] transition-all hover:bg-[#3D342C] active:scale-[0.98]"
          >
            Start cooking with {plan.recipe.creator.split(" ")[0]}
          </button>
          <p className="mt-2 text-center text-[11px] text-[#887B6C]">
            Headphones recommended. Tap Next when you&apos;re ready to move on.
          </p>
        </div>
      </div>

      {showConfirm && (
        <ConfirmationAlert
          creatorFirstName={plan.recipe.creator.split(" ")[0]}
          onConfirm={onStart}
          onDismiss={() => setShowConfirm(false)}
          isLoading={isInitializing}
        />
      )}
    </div>
  );
}
