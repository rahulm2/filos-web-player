"use client";

import { useState } from "react";
import type { PlaybackPlan } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProgressBar } from "./ProgressBar";

export function CompleteScreen({ plan }: { plan: PlaybackPlan }) {
  const { track } = useAnalytics();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");

  const handleSurvey = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
    track("survey_response", { question, answer });
  };

  const handleEmailSubmit = () => {
    if (email.trim()) {
      track("email_submit", { has_email: true });
      setEmail("");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F5F0EB]">
      <div className="mx-auto max-w-[480px] px-5 py-8">
        {/* Progress bar — all filled */}
        <ProgressBar phases={plan.phases} currentPhaseIndex={plan.phases.length} />

        {/* Header */}
        <div className="mt-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-[#EDE6DD]" />
          <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-[22px] text-[#2A231D]">
            Bon app&eacute;tit!
          </h1>
          <p className="mt-1 text-[13px] text-[#887B6C]">
            You just cooked with {plan.recipe.creator.split(" ")[0]}.
          </p>
        </div>

        <div className="mt-6 h-[0.5px] bg-[#DDD5CB]" />

        {/* Survey */}
        <div className="mt-6 space-y-5">
          {/* Q1 */}
          <div>
            <p className="text-[13px] text-[#2A231D]">
              Would you cook with {plan.recipe.creator.split(" ")[0]} this way again?
            </p>
            <div className="mt-2 flex gap-2">
              {["Definitely", "Maybe", "Probably not"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSurvey("cook_again", opt)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-[13px] transition-colors hover:bg-[#EDE6DD] active:scale-[0.97] ${
                    answers.cook_again === opt
                      ? "border-[#C9944A] text-[#C9944A]"
                      : "border-[#DDD5CB] text-[#2A231D]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div>
            <p className="text-[13px] text-[#2A231D]">Did you finish the recipe?</p>
            <div className="mt-2 flex gap-2">
              {["Yes", "Most of it", "No"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSurvey("finished", opt)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-[13px] transition-colors hover:bg-[#EDE6DD] active:scale-[0.97] ${
                    answers.finished === opt
                      ? "border-[#C9944A] text-[#C9944A]"
                      : "border-[#DDD5CB] text-[#2A231D]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div>
            <p className="text-[13px] text-[#2A231D]">Anything else?</p>
            <textarea
              className="mt-2 w-full rounded-lg border border-[#DDD5CB] bg-white p-3 text-[13px] placeholder:text-[#B0A89D] focus:border-[#C9944A] focus:outline-none"
              placeholder="Optional feedback..."
              rows={2}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  track("survey_response", { question: "feedback", answer: e.target.value });
                }
              }}
            />
          </div>
        </div>

        <div className="mt-6 h-[0.5px] bg-[#DDD5CB]" />

        {/* Email capture */}
        <div className="mt-6">
          <p className="text-[14px] text-[#2A231D]">
            Want to know when {plan.recipe.creator.split(" ")[0]}&apos;s next one drops?
          </p>
          <p className="mt-0.5 text-[12px] text-[#887B6C]">
            We&apos;ll let you know &mdash; nothing else.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-[#DDD5CB] bg-white px-3 py-2 text-[13px] placeholder:text-[#B0A89D] focus:border-[#C9944A] focus:outline-none"
            />
            <button
              onClick={handleEmailSubmit}
              className="cursor-pointer rounded-lg bg-[#2A231D] px-4 py-2 text-[13px] font-medium text-[#F5F0EB] transition-colors hover:bg-[#3D342C] active:scale-[0.97]"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
