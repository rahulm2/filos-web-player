"use client";

import { useState, useEffect } from "react";
import { isInstagramWebView, getCurrentUrl } from "@/lib/instagram-detect";

export function InstagramPrompt() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShow(isInstagramWebView());
  }, []);

  if (!show) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden input
    }
  };

  return (
    <div className="mb-4 rounded-lg bg-[#EDE6DD] p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#2A231D]">
            For the best experience, open in Safari
          </p>
          <p className="mt-0.5 text-[11px] text-[#887B6C]">
            Tap &hellip; above &rarr; Open in External Browser
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-[#887B6C] text-[18px] leading-none"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
      <button
        onClick={handleCopy}
        className="mt-2 rounded-md border border-[#DDD5CB] px-3 py-1.5 text-[12px] text-[#5C5347]"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
