"use client";

import type { Phase } from "@/lib/types";

export function ProgressBar({
  phases,
  currentPhaseIndex,
  stepsInPhase,
}: {
  phases: Phase[];
  currentPhaseIndex: number;
  stepsInPhase?: number;
}) {
  return (
    <div className="flex gap-[1.5px]">
      {phases.map((phase, i) => {
        let fill: string;
        if (i < currentPhaseIndex) {
          fill = "bg-[#C9944A]";
        } else if (i === currentPhaseIndex) {
          fill = "bg-[#C9944A]/60";
        } else {
          fill = "bg-[#DDD5CB]";
        }

        return (
          <div key={i} className={`h-[3px] flex-1 rounded-full ${fill}`}>
            {i === currentPhaseIndex && stepsInPhase !== undefined && (
              <div
                className="h-full rounded-full bg-[#C9944A]"
                style={{
                  width: `${Math.min(100, (stepsInPhase / phase.steps.length) * 100)}%`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
