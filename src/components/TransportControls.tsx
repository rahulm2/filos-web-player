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
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#443B31]"
        aria-label="Previous"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="#5C5347" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Repeat */}
      <button
        onClick={onRepeat}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#443B31]"
        aria-label="Repeat step"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8C2 4.7 4.7 2 8 2C11.3 2 14 4.7 14 8C14 11.3 11.3 14 8 14C6 14 4.2 13 3.2 11.5" stroke="#5C5347" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 8L2 11L0 8" stroke="#5C5347" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={isPaused ? onResume : onPause}
        className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[#F5F0EB]"
        aria-label={isPaused ? "Play" : "Pause"}
      >
        {isPaused ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 2L16 9L4 16V2Z" fill="#F5F0EB"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="4" y="3" width="3" height="12" rx="1" fill="#F5F0EB"/>
            <rect x="11" y="3" width="3" height="12" rx="1" fill="#F5F0EB"/>
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        className="flex h-10 items-center justify-center rounded-full border border-[#443B31] px-4"
        aria-label="Next"
      >
        <span className="text-[13px] text-[#887B6C]">Next</span>
      </button>
    </div>
  );
}
