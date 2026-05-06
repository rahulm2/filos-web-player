"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlaybackPlan } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProgressBar } from "./ProgressBar";
import { ShareButton } from "./ShareButton";

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
  const [describeExperience, setDescribeExperience] = useState("");
  const [specificMoments, setSpecificMoments] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  const handleSurvey = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
    track("survey_response", { question, answer });
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Please enter your email");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email");
      return;
    }

    setEmailError("");
    setSubmitting(true);

    // Track individual textarea responses that may not have been captured on blur
    if (describeExperience.trim()) {
      track("survey_response", { question: "describe_experience", answer: describeExperience.trim() });
    }
    if (specificMoments.trim()) {
      track("survey_response", { question: "specific_moments", answer: specificMoments.trim() });
    }
    if (anythingElse.trim()) {
      track("survey_response", { question: "feedback", answer: anythingElse.trim() });
    }

    try {
      const formData = {
        email: trimmedEmail,
        describe_experience: describeExperience.trim() || null,
        specific_moments: specificMoments.trim() || null,
        cook_again: answers.cook_again || null,
        feedback: anythingElse.trim() || null,
        recipe: plan.recipe.title,
        creator: plan.recipe.creator,
      };
      track("form_submit", formData);
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "form_submit",
          properties: formData,
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
      <div className="mx-auto max-w-[640px] px-5 py-5">
        {/* Progress bar — all filled */}
        <ProgressBar phases={plan.phases} currentPhaseIndex={plan.phases.length} />

        {/* Header */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
            <Image
              src={plan.recipe.creator_photo_url}
              alt={plan.recipe.creator}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-[20px] text-[#2A231D]">
              Bon app&eacute;tit!
            </h1>
            <p className="text-[13px] text-[#887B6C]">
              You just cooked with {plan.recipe.creator.split(" ")[0]}. Enjoy your risotto!
            </p>
          </div>
        </div>

        <div className="mt-4 h-[0.5px] bg-[#DDD5CB]" />

        {/* Survey */}
        <div className="mt-4 space-y-4">
          {/* Q1 — Describe the experience */}
          <div>
            <p className="text-[13px] text-[#2A231D]">Describe the experience in a few sentences.</p>
            <textarea
              className="mt-2 w-full rounded-lg border border-[#DDD5CB] bg-white p-3 text-[13px] placeholder:text-[#B0A89D] focus:border-[#C9944A] focus:outline-none"
              placeholder="What was it like cooking this way?"
              rows={2}
              value={describeExperience}
              onChange={(e) => setDescribeExperience(e.target.value)}
              onBlur={() => {
                if (describeExperience.trim()) {
                  track("survey_response", { question: "describe_experience", answer: describeExperience.trim() });
                }
              }}
            />
          </div>

          {/* Q2 — Specific moments */}
          <div>
            <p className="text-[13px] text-[#2A231D]">Was there a specific moment(s) that stuck with you?</p>
            <textarea
              className="mt-2 w-full rounded-lg border border-[#DDD5CB] bg-white p-3 text-[13px] placeholder:text-[#B0A89D] focus:border-[#C9944A] focus:outline-none"
              placeholder="A moment, a tip, something Clare said..."
              rows={2}
              value={specificMoments}
              onChange={(e) => setSpecificMoments(e.target.value)}
              onBlur={() => {
                if (specificMoments.trim()) {
                  track("survey_response", { question: "specific_moments", answer: specificMoments.trim() });
                }
              }}
            />
          </div>

          {/* Q3 — Cook again */}
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
                      ? "border-[#C9944A] bg-[#C9944A]/15 text-[#C9944A] font-medium"
                      : "border-[#DDD5CB] text-[#2A231D]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q4 — Anything else */}
          <div>
            <p className="text-[13px] text-[#2A231D]">Anything else?</p>
            <textarea
              className="mt-2 w-full rounded-lg border border-[#DDD5CB] bg-white p-3 text-[13px] placeholder:text-[#B0A89D] focus:border-[#C9944A] focus:outline-none"
              placeholder="Optional feedback..."
              rows={2}
              value={anythingElse}
              onChange={(e) => setAnythingElse(e.target.value)}
              onBlur={() => {
                if (anythingElse.trim()) {
                  track("survey_response", { question: "feedback", answer: anythingElse.trim() });
                }
              }}
            />
          </div>

          {/* Q5 — Email */}
          <div>
            <p className="text-[13px] text-[#2A231D]">Can we reach out to you?</p>
            <p className="mt-0.5 text-[12px] text-[#887B6C]">
              We&apos;d like to hear your feedback. We&apos;ll also be sure to send you a note when the next cookalong drops.
            </p>

            {submitted ? (
              <div className="mt-3 rounded-lg bg-[#EDE6DD] px-4 py-3">
                <p className="text-[13px] text-[#2A231D]">
                  You&apos;re in! We&apos;ll be in touch.
                </p>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="your@email.com"
                  className={`mt-3 w-full rounded-lg border bg-white px-3 py-2 text-[13px] placeholder:text-[#B0A89D] focus:outline-none ${
                    emailError
                      ? "border-red-400 focus:border-red-400"
                      : "border-[#DDD5CB] focus:border-[#C9944A]"
                  }`}
                />
                {emailError && (
                  <p className="mt-1 text-[11px] text-red-500">{emailError}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Submit button — full width, submits entire form */}
        {!submitted && (
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full cursor-pointer rounded-[10px] bg-[#2A231D] px-6 py-[14px] text-[15px] font-medium text-[#F5F0EB] transition-all hover:bg-[#3D342C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-1.5">
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
        )}

        <div className="mt-8 h-[0.5px] bg-[#DDD5CB]" />

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={onRestart}
            className="cursor-pointer rounded-[10px] border border-[#DDD5CB] px-6 py-3 text-[14px] font-medium text-[#2A231D] transition-all hover:border-[#C9944A] hover:text-[#C9944A] active:scale-[0.97]"
          >
            Cook this again
          </button>
          <ShareButton variant="light" />
        </div>
      </div>
    </div>
  );
}
