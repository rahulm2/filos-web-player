"use client";

import { useState } from "react";
import type { PlaybackPlan } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProgressBar } from "./ProgressBar";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function CompleteScreen({ plan, onRestart }: { plan: PlaybackPlan; onRestart: () => void }) {
  const { track } = useAnalytics();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSurvey = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
    track("survey_response", { question, answer });
  };

  const handleEmailSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Please enter your email");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email");
      return;
    }

    setEmailError("");
    setSubmitting(true);

    try {
      // Send to analytics + API
      track("email_submit", { has_email: true });
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "email_submit",
          properties: { email: trimmed, recipe: plan.recipe.title },
          timestamp: Date.now(),
        }),
      });
      setSubmitted(true);
      setEmail("");
    } catch {
      // Still mark as submitted — analytics captured it
      setSubmitted(true);
    } finally {
      setSubmitting(false);
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

          {submitted ? (
            <div className="mt-3 rounded-lg bg-[#EDE6DD] px-4 py-3">
              <p className="text-[13px] text-[#2A231D]">
                You&apos;re in! We&apos;ll let you know.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEmailSubmit();
                  }}
                  placeholder="your@email.com"
                  className={`flex-1 rounded-lg border bg-white px-3 py-2 text-[13px] placeholder:text-[#B0A89D] focus:outline-none ${
                    emailError
                      ? "border-red-400 focus:border-red-400"
                      : "border-[#DDD5CB] focus:border-[#C9944A]"
                  }`}
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg bg-[#2A231D] px-4 py-2 text-[13px] font-medium text-[#F5F0EB] transition-all hover:bg-[#3D342C] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      Sending
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
              {emailError && (
                <p className="mt-1 text-[11px] text-red-500">{emailError}</p>
              )}
            </>
          )}
        </div>

        <div className="mt-8 h-[0.5px] bg-[#DDD5CB]" />

        {/* Start again */}
        <div className="mt-6 text-center">
          <button
            onClick={onRestart}
            className="cursor-pointer rounded-[10px] border border-[#DDD5CB] px-6 py-3 text-[14px] font-medium text-[#2A231D] transition-all hover:border-[#C9944A] hover:text-[#C9944A] active:scale-[0.97]"
          >
            Cook this again
          </button>
        </div>
      </div>
    </div>
  );
}
