"use client";

import type { PlaybackPlan } from "@/lib/types";

export function ReferencePanel({
  plan,
  isOpen,
  onClose,
}: {
  plan: PlaybackPlan;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 h-full w-[300px] max-w-[80vw] overflow-y-auto bg-[#443B31] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-[1px] text-[#887B6C]">
            Ingredients
          </h3>
          <button
            onClick={onClose}
            className="text-[#887B6C] text-[18px]"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="mt-4 space-y-0">
          {plan.ingredients.map((ing, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-[#5C5347]/30 py-2.5"
            >
              <span className="text-[13px] text-[#F5F0EB]">{ing.name}</span>
              <span className="text-[12px] text-[#887B6C]">{ing.quantity}</span>
            </div>
          ))}
        </div>

        <details className="mt-4">
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

        <div className="mt-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-[1px] text-[#887B6C]">
            Gear
          </h3>
          <p className="mt-2 text-[12px] text-[#DDD5CB]">
            {plan.equipment.join(" \u00B7 ")}
          </p>
        </div>
      </div>
    </div>
  );
}
