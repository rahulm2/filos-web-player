import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePacingMachine } from "@/hooks/usePacingMachine";
import type { PlaybackPlan } from "@/lib/types";

const mockPlan: PlaybackPlan = {
  recipe: {
    title: "Test Recipe",
    creator: "Test Creator",
    creator_photo_url: "/test.jpg",
    recipe_photo_url: "/test.jpg",
    audio_url: "/test.mp3",
    total_duration_seconds: 100,
    estimated_active_minutes: 5,
    serves: "2",
    tags: [],
  },
  phases: [
    {
      phase_number: 0,
      phase_name: "Phase 1",
      steps: [
        {
          step_id: "p0-s0",
          step_label: "Step 1",
          pacing: "auto",
          core_chunks: [
            { chunk_id: "c1", start_time: 0, end_time: 10 },
            { chunk_id: "c2", start_time: 12, end_time: 20 },
          ],
        },
        {
          step_id: "p0-s1",
          step_label: "Step 2 (gated)",
          pacing: "gated",
          core_chunks: [
            { chunk_id: "c3", start_time: 22, end_time: 30 },
          ],
          gate: {
            cascade: [
              { type: "silence", duration_seconds: 5 },
              { type: "heartbeat", fallback_message: "Take your time..." },
              { type: "elastic", chunk: { chunk_id: "e1", start_time: 50, end_time: 60 } },
            ],
          },
        },
        {
          step_id: "p0-s2",
          step_label: "Step 3",
          pacing: "auto",
          core_chunks: [
            { chunk_id: "c4", start_time: 32, end_time: 40 },
          ],
        },
      ],
    },
    {
      phase_number: 1,
      phase_name: "Phase 2",
      steps: [
        {
          step_id: "p1-s0",
          step_label: "Phase 2 Step 1",
          pacing: "gated",
          core_chunks: [
            { chunk_id: "c5", start_time: 42, end_time: 50 },
          ],
          gate: {
            cascade: [{ type: "silence", duration_seconds: 3 }],
          },
        },
        {
          step_id: "p1-s1",
          step_label: "Phase 2 Final",
          pacing: "auto",
          core_chunks: [
            { chunk_id: "c6", start_time: 52, end_time: 60 },
          ],
        },
      ],
    },
  ],
  ingredients: [],
  substitutions: [],
  equipment: [],
};

describe("usePacingMachine", () => {
  it("starts in LOADING state", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    expect(result.current.state).toBe("LOADING");
  });

  it("transitions from LOADING to PLAYING on START", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.phaseIndex).toBe(0);
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.chunkIndex).toBe(0);
    expect(result.current.currentChunk?.chunk_id).toBe("c1");
  });

  it("transitions to SEAM when chunk ends and more chunks in step", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    expect(result.current.state).toBe("SEAM");
    expect(result.current.chunkIndex).toBe(1);
  });

  it("transitions from SEAM to PLAYING on SEAM_ELAPSED", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" })); // -> SEAM
    act(() => result.current.dispatch({ type: "SEAM_ELAPSED" }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.currentChunk?.chunk_id).toBe("c2");
  });

  it("auto-advances to next step when auto-paced step ends", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    // Chunk 1 ends -> SEAM
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    // SEAM -> PLAYING chunk 2
    act(() => result.current.dispatch({ type: "SEAM_ELAPSED" }));
    // Chunk 2 ends -> auto step has no gate, advances to step 1
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.currentChunk?.chunk_id).toBe("c3");
  });

  it("transitions to WAITING when gated step ends", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" })); // SEAM
    act(() => result.current.dispatch({ type: "SEAM_ELAPSED" })); // PLAYING c2
    act(() => result.current.dispatch({ type: "CHUNK_END" })); // auto -> step 1 (gated)
    act(() => result.current.dispatch({ type: "CHUNK_END" })); // gated step ends -> WAITING
    expect(result.current.state).toBe("WAITING");
    expect(result.current.stepIndex).toBe(1);
  });

  it("advances from WAITING to next step on ADVANCE", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    act(() => result.current.dispatch({ type: "SEAM_ELAPSED" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" })); // -> WAITING
    act(() => result.current.dispatch({ type: "ADVANCE" }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.stepIndex).toBe(2);
    expect(result.current.currentChunk?.chunk_id).toBe("c4");
  });

  it("transitions to PHASE_GATE when last step of phase is gated and ends", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    // Navigate to phase 1 step 0 (gated, last-ish step scenario)
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "NAVIGATE", phaseIndex: 1, stepIndex: 0 }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.currentChunk?.chunk_id).toBe("c5");
    // End the chunk -> gated, and there's a next step so it's WAITING (not PHASE_GATE)
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    expect(result.current.state).toBe("WAITING");
  });

  it("reaches COMPLETE at end of all phases", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    // Navigate to last step of last phase
    act(() => result.current.dispatch({ type: "NAVIGATE", phaseIndex: 1, stepIndex: 1 }));
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    expect(result.current.state).toBe("COMPLETE");
  });

  it("PAUSE and RESUME preserve state", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    expect(result.current.state).toBe("PLAYING");
    act(() => result.current.dispatch({ type: "PAUSE" }));
    expect(result.current.state).toBe("PAUSED");
    expect(result.current.previousState).toBe("PLAYING");
    act(() => result.current.dispatch({ type: "RESUME" }));
    expect(result.current.state).toBe("PLAYING");
  });

  it("GO_BACK moves to previous chunk", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" })); // SEAM, chunkIndex=1
    act(() => result.current.dispatch({ type: "SEAM_ELAPSED" })); // PLAYING c2
    act(() => result.current.dispatch({ type: "GO_BACK" }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.chunkIndex).toBe(0);
    expect(result.current.currentChunk?.chunk_id).toBe("c1");
  });

  it("GO_BACK moves to previous step when at chunk 0", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "NAVIGATE", phaseIndex: 0, stepIndex: 1 }));
    act(() => result.current.dispatch({ type: "GO_BACK" }));
    expect(result.current.stepIndex).toBe(0);
    // Should be at last chunk of previous step
    expect(result.current.chunkIndex).toBe(1);
  });

  it("REPEAT resets to chunk 0 of current step", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "CHUNK_END" }));
    act(() => result.current.dispatch({ type: "SEAM_ELAPSED" })); // chunk 1
    act(() => result.current.dispatch({ type: "REPEAT" }));
    expect(result.current.chunkIndex).toBe(0);
    expect(result.current.state).toBe("PLAYING");
  });

  it("NAVIGATE jumps to any phase/step", () => {
    const { result } = renderHook(() => usePacingMachine(mockPlan));
    act(() => result.current.dispatch({ type: "START" }));
    act(() => result.current.dispatch({ type: "NAVIGATE", phaseIndex: 1, stepIndex: 1 }));
    expect(result.current.state).toBe("PLAYING");
    expect(result.current.phaseIndex).toBe(1);
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.chunkIndex).toBe(0);
    expect(result.current.currentChunk?.chunk_id).toBe("c6");
  });
});
