"use client";

import { useState } from "react";

export function ShareButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: "Cook with Clare — Tomato Risotto",
      text: "Cook along with Clare's guided tomato risotto!",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  const colors = variant === "dark"
    ? "border-[#443B31] text-[#887B6C] hover:border-[#F5F0EB] hover:text-[#F5F0EB]"
    : "border-[#DDD5CB] text-[#887B6C] hover:border-[#2A231D] hover:text-[#2A231D]";

  return (
    <button
      onClick={handleShare}
      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-all active:scale-95 ${colors}`}
      aria-label="Share"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
