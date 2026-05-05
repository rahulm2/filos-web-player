"use client";

export function ConfirmationAlert({
  creatorFirstName,
  onConfirm,
  onDismiss,
}: {
  creatorFirstName: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-[320px] rounded-xl bg-[#F5F0EB] p-6 shadow-lg">
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
      </div>
    </div>
  );
}
