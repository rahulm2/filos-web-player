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
      // User cancelled or share failed
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  const bg = variant === "dark"
    ? "bg-[#443B31] hover:bg-[#5C5347] text-[#F5F0EB]"
    : "bg-[#EDE6DD] hover:bg-[#DDD5CB] text-[#2A231D]";

  return (
    <button
      onClick={handleShare}
      className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all active:scale-90 ${bg}`}
      aria-label="Share"
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}
