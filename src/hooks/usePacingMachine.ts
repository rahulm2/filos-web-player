"use client";

import { useReducer, useCallback } from "react";
import type { PacingState, PacingAction, PlaybackPlan, Chunk } from "@/lib/types";

interface PacingContext {
  state: PacingState;
  previousState: PacingState | null;
  phaseIndex: number;
  stepIndex: number;
  chunkIndex: number;
  currentChunk: Chunk | null;
  currentEndTime: number | null;
}

interface ReducerState {
  state: PacingState;
  previousState: PacingState | null;
  phaseIndex: number;
  stepIndex: number;
  chunkIndex: number;
}

function createReducer(plan: PlaybackPlan) {
  return function reducer(s: ReducerState, action: PacingAction): ReducerState {
    switch (action.type) {
      case "START":
        return { ...s, state: "PLAYING", phaseIndex: 0, stepIndex: 0, chunkIndex: 0 };

      case "CHUNK_END": {
        const phase = plan.phases[s.phaseIndex];
        const step = phase.steps[s.stepIndex];
        const nextChunkIdx = s.chunkIndex + 1;

        // More chunks in this step → SEAM
        if (nextChunkIdx < step.core_chunks.length) {
          return { ...s, state: "SEAM", chunkIndex: nextChunkIdx };
        }

        // Step done — find next step
        const nextStepIdx = s.stepIndex + 1;

        // More steps in this phase
        if (nextStepIdx < phase.steps.length) {
          const nextStep = phase.steps[nextStepIdx];
          // Current step was gated → WAITING
          if (step.pacing === "gated" && step.gate) {
            return { ...s, state: "WAITING" };
          }
          // Auto → advance to next step
          return { ...s, state: "PLAYING", stepIndex: nextStepIdx, chunkIndex: 0 };
          // If next step should auto-play, it will be handled by the component
          void nextStep;
        }

        // Phase done — more phases?
        const nextPhaseIdx = s.phaseIndex + 1;
        if (nextPhaseIdx < plan.phases.length) {
          // Current step was gated → PHASE_GATE
          if (step.pacing === "gated" && step.gate) {
            return { ...s, state: "PHASE_GATE" };
          }
          return { ...s, state: "PHASE_GATE" };
        }

        // All done
        return { ...s, state: "COMPLETE" };
      }

      case "SEAM_ELAPSED":
        return { ...s, state: "PLAYING" };

      case "ADVANCE": {
        // From WAITING → next step
        if (s.state === "WAITING") {
          const nextStepIdx = s.stepIndex + 1;
          return { ...s, state: "PLAYING", stepIndex: nextStepIdx, chunkIndex: 0 };
        }
        // From PHASE_GATE → first step of next phase
        if (s.state === "PHASE_GATE") {
          const nextPhaseIdx = s.phaseIndex + 1;
          return { ...s, state: "PLAYING", phaseIndex: nextPhaseIdx, stepIndex: 0, chunkIndex: 0 };
        }
        // From PLAYING → skip to next gate/step
        if (s.state === "PLAYING") {
          const phase = plan.phases[s.phaseIndex];
          const nextStepIdx = s.stepIndex + 1;
          if (nextStepIdx < phase.steps.length) {
            return { ...s, state: "PLAYING", stepIndex: nextStepIdx, chunkIndex: 0 };
          }
          const nextPhaseIdx = s.phaseIndex + 1;
          if (nextPhaseIdx < plan.phases.length) {
            return { ...s, state: "PLAYING", phaseIndex: nextPhaseIdx, stepIndex: 0, chunkIndex: 0 };
          }
          return { ...s, state: "COMPLETE" };
        }
        return s;
      }

      case "PAUSE":
        return { ...s, state: "PAUSED", previousState: s.state };

      case "RESUME":
        return { ...s, state: s.previousState ?? "PLAYING", previousState: null };

      case "GO_BACK": {
        // NOTE: WAITING/PHASE_GATE "go back" is handled at the component level
        // (restarts cascade) — the reducer only handles PLAYING/PAUSED-from-PLAYING.

        // Go to previous chunk or step
        if (s.chunkIndex > 0) {
          return { ...s, state: "PLAYING", previousState: null, chunkIndex: s.chunkIndex - 1 };
        }
        if (s.stepIndex > 0) {
          const prevStep = plan.phases[s.phaseIndex].steps[s.stepIndex - 1];
          return {
            ...s,
            state: "PLAYING",
            previousState: null,
            stepIndex: s.stepIndex - 1,
            chunkIndex: prevStep.core_chunks.length - 1,
          };
        }
        if (s.phaseIndex > 0) {
          const prevPhase = plan.phases[s.phaseIndex - 1];
          const lastStep = prevPhase.steps[prevPhase.steps.length - 1];
          return {
            ...s,
            state: "PLAYING",
            previousState: null,
            phaseIndex: s.phaseIndex - 1,
            stepIndex: prevPhase.steps.length - 1,
            chunkIndex: lastStep.core_chunks.length - 1,
          };
        }
        // Already at start — replay current
        return { ...s, state: "PLAYING", previousState: null, chunkIndex: 0 };
      }

      case "REPEAT": {
        return { ...s, state: "PLAYING", previousState: null, chunkIndex: 0 };
      }

      case "NAVIGATE": {
        return {
          ...s,
          state: "PLAYING",
          phaseIndex: action.phaseIndex,
          stepIndex: action.stepIndex,
          chunkIndex: 0,
        };
      }

      case "NAVIGATE_CHUNK": {
        return {
          ...s,
          state: "PLAYING",
          phaseIndex: action.phaseIndex,
          stepIndex: action.stepIndex,
          chunkIndex: action.chunkIndex,
        };
      }

      case "RESTART": {
        return {
          state: "LOADING",
          previousState: null,
          phaseIndex: 0,
          stepIndex: 0,
          chunkIndex: 0,
        };
      }

      default:
        return s;
    }
  };
}

export function usePacingMachine(plan: PlaybackPlan): PacingContext & { dispatch: React.Dispatch<PacingAction> } {
  const reducer = useCallback(createReducer(plan), [plan]);

  const [state, dispatch] = useReducer(reducer, {
    state: "LOADING" as PacingState,
    previousState: null,
    phaseIndex: 0,
    stepIndex: 0,
    chunkIndex: 0,
  });

  const currentPhase = plan.phases[state.phaseIndex];
  const currentStep = currentPhase?.steps[state.stepIndex];
  const currentChunk = currentStep?.core_chunks[state.chunkIndex] ?? null;
  const currentEndTime = currentChunk?.end_time ?? null;

  return {
    ...state,
    currentChunk,
    currentEndTime,
    dispatch,
  };
}
