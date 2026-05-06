"use client";

import Image from "next/image";
import type { PlaybackPlan } from "@/lib/types";

export function OnboardingInterstitial({
  plan,
  onComplete,
}: {
  plan: PlaybackPlan;
  onComplete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#2A231D] px-8">
      <div className="max-w-[360px] text-center">
        {/* Creator photo */}
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full">
          <Image
            src={plan.recipe.creator_photo_url}
            alt={plan.recipe.creator}
            fill
            className="object-cover"
          />
        </div>

        <h2 className="mt-5 font-[family-name:var(--font-fraunces)] text-[20px] text-[#F5F0EB]">
          Here&apos;s how it works
        </h2>

        <ul className="mt-5 space-y-3 text-left">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-[14px] text-[#C9944A]">1</span>
            <span className="text-[14px] leading-relaxed text-[#F5F0EB]/80">
              {plan.recipe.creator.split(" ")[0]} will guide you step by step
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-[14px] text-[#C9944A]">2</span>
            <span className="text-[14px] leading-relaxed text-[#F5F0EB]/80">
              She&apos;ll pause between steps — tap <span className="font-medium text-[#F5F0EB]">Next</span> when you&apos;re ready
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-[14px] text-[#C9944A]">3</span>
            <span className="text-[14px] leading-relaxed text-[#F5F0EB]/80">
              She may share tips while you work — tap <span className="font-medium text-[#F5F0EB]">Next</span> anytime to move on
            </span>
          </li>
        </ul>

        <button
          onClick={onComplete}
          className="mt-8 w-full cursor-pointer rounded-[10px] bg-[#C9944A] px-6 py-[14px] text-[15px] font-medium text-[#2A231D] transition-all hover:bg-[#D4A35B] active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
