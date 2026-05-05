"use client";

import { useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function TransportControls({
  isPaused,
  onBack,
  onRepeat,
  onPause,
  onResume,
  onNext,
  onSpeedChange,
  currentSpeed = 1,
}: {
  isPaused: boolean;
  onBack: () => void;
  onRepeat: () => void;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onSpeedChange?: (speed: number) => void;
  currentSpeed?: number;
}) {
  const [showSpeed, setShowSpeed] = useState(false);

  const cycleSpeed = () => {
    if (!onSpeedChange) return;
    const idx = SPEEDS.indexOf(currentSpeed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange(next);
  };

  return (
    <div className="relative">
      {/* Speed selector popup */}
      {showSpeed && onSpeedChange && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-[#443B31] p-2 shadow-lg">
          <div className="flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => { onSpeedChange(s); setShowSpeed(false); }}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  s === currentSpeed
                    ? "bg-[#C9944A] text-[#2A231D]"
                    : "text-[#887B6C] hover:bg-[#5C5347] hover:text-[#F5F0EB]"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#C9944A] transition-all hover:bg-[#C9944A]/20 active:scale-95"
          aria-label="Previous"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L5 9L11 4" stroke="#C9944A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Speed */}
        {onSpeedChange && (
          <button
            onClick={() => setShowSpeed(!showSpeed)}
            onDoubleClick={cycleSpeed}
            className="flex h-9 cursor-pointer items-center justify-center rounded-full border border-[#5C5347] px-2.5 transition-all hover:border-[#F5F0EB] hover:bg-[#443B31] active:scale-95"
            aria-label="Playback speed"
          >
            <span className="text-[11px] font-medium text-[#F5F0EB]">
              {currentSpeed}x
            </span>
          </button>
        )}

        {/* Play/Pause */}
        <button
          onClick={isPaused ? onResume : onPause}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[2px] border-[#F5F0EB] transition-all hover:bg-[#F5F0EB]/10 active:scale-95"
          aria-label={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? (
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M4 2L16 9L4 16V2Z" fill="#F5F0EB"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <rect x="4" y="3" width="3" height="12" rx="1" fill="#F5F0EB"/>
              <rect x="11" y="3" width="3" height="12" rx="1" fill="#F5F0EB"/>
            </svg>
          )}
        </button>

        {/* Repeat */}
        <button
          onClick={onRepeat}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#5C5347] transition-all hover:border-[#F5F0EB] hover:bg-[#443B31] active:scale-95"
          aria-label="Repeat step"
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
            <path d="M3 9C3 5.7 5.7 3 9 3C12.3 3 15 5.7 15 9C15 12.3 12.3 15 9 15C7 15 5.2 14 4.2 12.5" stroke="#F5F0EB" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 9L3 12L1 9" stroke="#F5F0EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#C9944A] transition-all hover:bg-[#C9944A]/20 active:scale-95"
          aria-label="Next"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4L13 9L7 14" stroke="#C9944A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
