"use client";

export function TransportControls({
  isPaused,
  onBack,
  onRepeat,
  onPause,
  onResume,
  onNext,
}: {
  isPaused: boolean;
  onBack: () => void;
  onRepeat: () => void;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#5C5347] transition-all hover:border-[#F5F0EB] hover:bg-[#443B31] active:scale-95"
        aria-label="Previous"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L5 9L11 4" stroke="#F5F0EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Repeat */}
      <button
        onClick={onRepeat}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#5C5347] transition-all hover:border-[#F5F0EB] hover:bg-[#443B31] active:scale-95"
        aria-label="Repeat step"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 9C3 5.7 5.7 3 9 3C12.3 3 15 5.7 15 9C15 12.3 12.3 15 9 15C7 15 5.2 14 4.2 12.5" stroke="#F5F0EB" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 9L3 12L1 9" stroke="#F5F0EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

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

      {/* Next — arrow style like back */}
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
  );
}
