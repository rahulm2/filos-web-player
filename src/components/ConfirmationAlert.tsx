"use client";

export function ConfirmationAlert({
  creatorFirstName,
  onConfirm,
  onDismiss,
  isLoading = false,
  preloadProgress = 1,
}: {
  creatorFirstName: string;
  onConfirm: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  preloadProgress?: number;
}) {
  const audioReady = preloadProgress >= 1;
  const showLoading = isLoading || !audioReady;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-[320px] rounded-xl bg-[#F5F0EB] p-6 shadow-lg">
        {showLoading ? (
          <>
            <h2 className="font-[family-name:var(--font-fraunces)] text-[18px] text-[#2A231D]">
              {isLoading ? "Starting..." : "Loading audio..."}
            </h2>

            <div className="mt-5 flex flex-col items-center gap-3">
              {!audioReady && (
                <div className="w-full">
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#EDE6DD]">
                    <div
                      className="h-full rounded-full bg-[#C9944A] transition-[width] duration-300"
                      style={{ width: `${preloadProgress * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-[12px] tabular-nums text-[#887B6C]">
                    {Math.round(preloadProgress * 100)}%
                  </p>
                </div>
              )}
              {isLoading && (
                <svg className="h-8 w-8 animate-spin text-[#C9944A]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              )}
              <p className="text-[13px] text-[#887B6C]">
                Preparing {creatorFirstName}&apos;s kitchen...
              </p>
            </div>

            {!isLoading && (
              <button
                onClick={onDismiss}
                className="mt-4 w-full cursor-pointer rounded-lg py-2 text-center text-[13px] text-[#5C5347] transition-colors hover:bg-[#EDE6DD] hover:text-[#2A231D]"
              >
                Go back
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-fraunces)] text-[18px] text-[#2A231D]">
              Ready to cook?
            </h2>

            <ul className="mt-4 space-y-2 text-[13px] text-[#2A231D]">
              <li className="flex items-center gap-2">
                <span className="text-[#C9944A]">&#10003;</span>
                Ingredients and gear ready
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C9944A]">&#10003;</span>
                Headphones in
              </li>
            </ul>

            <button
              onClick={onConfirm}
              className="mt-6 w-full cursor-pointer rounded-[10px] bg-[#2A231D] px-6 py-[14px] text-[15px] font-medium text-[#F5F0EB] transition-all hover:bg-[#3D342C] active:scale-[0.98]"
            >
              Let&apos;s go
            </button>

            <button
              onClick={onDismiss}
              className="mt-3 w-full cursor-pointer rounded-lg py-2 text-center text-[13px] text-[#5C5347] transition-colors hover:bg-[#EDE6DD] hover:text-[#2A231D]"
            >
              Go back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
