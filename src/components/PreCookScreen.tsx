"use client";

import { useState } from "react";
import type { PlaybackPlan } from "@/lib/types";
import { ConfirmationAlert } from "./ConfirmationAlert";
import { ProgressBar } from "./ProgressBar";
import { InstagramPrompt } from "./InstagramPrompt";

export function PreCookScreen({
  plan,
  onStart,
}: {
  plan: PlaybackPlan;
  onStart: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <InstagramPrompt />

        {/* Hero image */}
        <div className="relative -mx-5 h-[180px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F0EB]" />
          <div className="h-full w-full bg-[#EDE6DD]" />
        </div>

        {/* Header */}
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#887B6C]">
            Cook with
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-fraunces)] text-[26px] text-[#2A231D]">
            {plan.recipe.creator}
          </h1>
          <h2 className="mt-0.5 font-[family-name:var(--font-fraunces)] text-[17px] text-[#2A231D]">
            {plan.recipe.title}
          </h2>
        </div>

        {/* Metadata chips */}
        <div className="mt-4 flex flex-wrap gap-2">
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

        {/* Ingredients */}
        <div className="mt-8">
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
                <span className="text-[13px] text-[#887B6C]">{ing.quantity}</span>
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

        {/* CTA */}
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-8 w-full rounded-[10px] bg-[#2A231D] px-6 py-[14px] text-[15px] font-medium text-[#F5F0EB] active:scale-[0.98] transition-transform"
        >
          Start cooking with {plan.recipe.creator.split(" ")[0]}
        </button>

        <p className="mt-3 text-center text-[11px] text-[#887B6C]">
          Headphones recommended. Tap Next when you&apos;re ready to move on.
        </p>
      </div>

      {showConfirm && (
        <ConfirmationAlert
          creatorFirstName={plan.recipe.creator.split(" ")[0]}
          onConfirm={onStart}
          onDismiss={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
