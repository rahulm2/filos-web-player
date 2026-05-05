import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCascadeSequencer } from "@/hooks/useCascadeSequencer";
import type { CascadeEntry } from "@/lib/types";

describe("useCascadeSequencer", () => {
  let mockPlayAudio: ReturnType<typeof vi.fn>;
  let mockFadeOut: ReturnType<typeof vi.fn>;
  let mockPauseAudio: ReturnType<typeof vi.fn>;
  let mockGetAudioTime: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPlayAudio = vi.fn();
    mockFadeOut = vi.fn(() => Promise.resolve());
    mockPauseAudio = vi.fn();
    // Default: audio time not yet at end (so audio entries block)
    mockGetAudioTime = vi.fn(() => 0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function startCascade(hook: ReturnType<typeof useCascadeSequencer>, cascade: CascadeEntry[]) {
    act(() => {
      hook.start(cascade, mockPlayAudio, mockFadeOut, mockPauseAudio, mockGetAudioTime);
    });
  }

  // Simulate audio reaching a target time by updating the mock
  function simulateAudioReachingEnd(endTime: number) {
    mockGetAudioTime.mockReturnValue(endTime);
  }

  it("starts in inactive state", () => {
    const { result } = renderHook(() => useCascadeSequencer());
    expect(result.current.state.isRunning).toBe(false);
    expect(result.current.state.phase).toBe("inactive");
  });

  it("processes silence entries by waiting the specified duration", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      { type: "silence", duration_seconds: 5 },
    ];

    startCascade(result.current, cascade);
    expect(result.current.state.isRunning).toBe(true);
    expect(result.current.state.phase).toBe("silence");
    expect(result.current.state.statusText).toBe("Take your time...");

    // Advance past the 5s silence (100ms ticks)
    await act(async () => { vi.advanceTimersByTime(5500); });

    // Should be idle (cascade exhausted)
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.statusText).toBe("Clare's here when you're ready");
  });

  it("processes heartbeat without chunk (text-only for 5s)", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      { type: "heartbeat", fallback_message: "You got this..." },
    ];

    startCascade(result.current, cascade);

    // First tick enters heartbeat
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(result.current.state.phase).toBe("heartbeat");
    expect(result.current.state.statusText).toBe("You got this...");
    expect(result.current.state.isPlayingAudio).toBe(false);

    // Wait 5s for text display
    await act(async () => { vi.advanceTimersByTime(5500); });
    expect(result.current.state.phase).toBe("idle");
  });

  it("processes heartbeat with chunk (plays audio)", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      {
        type: "heartbeat",
        chunk: { chunk_id: "hb1", start_time: 10, end_time: 15 },
        fallback_message: "No rush...",
      },
    ];

    startCascade(result.current, cascade);
    // Let the async run start
    await act(async () => { vi.advanceTimersByTime(50); });

    expect(result.current.state.phase).toBe("heartbeat");
    expect(result.current.state.statusText).toBe("No rush...");
    expect(result.current.state.isPlayingAudio).toBe(true);
    expect(mockPlayAudio).toHaveBeenCalledWith(10, 15);

    // Audio hasn't ended yet — still waiting
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(result.current.state.phase).toBe("heartbeat");

    // Simulate audio reaching end
    simulateAudioReachingEnd(15);
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(mockPauseAudio).toHaveBeenCalled();
    expect(result.current.state.phase).toBe("idle");
  });

  it("processes elastic entry (plays audio segment)", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      {
        type: "elastic",
        chunk: { chunk_id: "e1", start_time: 50, end_time: 80 },
        relevance_label: "Clare on stock — homemade tips",
      },
    ];

    startCascade(result.current, cascade);
    await act(async () => { vi.advanceTimersByTime(50); });

    expect(result.current.state.phase).toBe("elastic");
    expect(result.current.state.statusText).toContain("Clare on stock");
    expect(result.current.state.isPlayingAudio).toBe(true);
    expect(mockPlayAudio).toHaveBeenCalledWith(50, 80);

    // Simulate audio finishing
    simulateAudioReachingEnd(80);
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(mockPauseAudio).toHaveBeenCalled();
    expect(result.current.state.phase).toBe("idle");
  });

  it("interrupt during silence exits immediately without playing audio", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      { type: "silence", duration_seconds: 30 },
      { type: "elastic", chunk: { chunk_id: "e1", start_time: 50, end_time: 80 } },
    ];

    startCascade(result.current, cascade);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(result.current.state.phase).toBe("silence");

    // Interrupt (user taps Next)
    await act(async () => { await result.current.interrupt(); });
    expect(result.current.state.isRunning).toBe(false);
    expect(result.current.state.phase).toBe("inactive");
    // Elastic should never have played
    expect(mockPlayAudio).not.toHaveBeenCalled();
  });

  it("interrupt during elastic audio triggers fadeOut", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      {
        type: "elastic",
        chunk: { chunk_id: "e1", start_time: 50, end_time: 80 },
      },
    ];

    startCascade(result.current, cascade);
    await act(async () => { vi.advanceTimersByTime(50); });
    expect(result.current.state.isPlayingAudio).toBe(true);

    // Interrupt while audio is playing (getAudioTime < endTime)
    await act(async () => { await result.current.interrupt(); });
    expect(mockFadeOut).toHaveBeenCalled();
    expect(result.current.state.isRunning).toBe(false);
  });

  it("processes a full cascade sequence in order", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      { type: "silence", duration_seconds: 3 },
      { type: "heartbeat", fallback_message: "Getting started..." },
      { type: "silence", duration_seconds: 2 },
      {
        type: "elastic",
        chunk: { chunk_id: "e1", start_time: 50, end_time: 60 },
        relevance_label: "Stock tips",
      },
    ];

    startCascade(result.current, cascade);

    // 1. Silence (3s)
    expect(result.current.state.phase).toBe("silence");
    await act(async () => { vi.advanceTimersByTime(3500); });

    // 2. Heartbeat text (5s)
    expect(result.current.state.phase).toBe("heartbeat");
    expect(result.current.state.statusText).toBe("Getting started...");
    await act(async () => { vi.advanceTimersByTime(5500); });

    // 3. Silence (2s)
    expect(result.current.state.phase).toBe("silence");
    await act(async () => { vi.advanceTimersByTime(2500); });

    // 4. Elastic (audio plays)
    expect(result.current.state.phase).toBe("elastic");
    expect(mockPlayAudio).toHaveBeenCalledWith(50, 60);

    // Simulate audio reaching end
    simulateAudioReachingEnd(60);
    await act(async () => { vi.advanceTimersByTime(200); });

    // Exhausted -> idle
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.isRunning).toBe(true);
  });

  it("pause freezes cascade, resume continues", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      { type: "silence", duration_seconds: 10 },
    ];

    startCascade(result.current, cascade);
    await act(async () => { vi.advanceTimersByTime(3000); });

    // Pause
    act(() => { result.current.pauseCascade(); });

    // Advance time — should NOT progress past silence
    await act(async () => { vi.advanceTimersByTime(15000); });
    // Still running, still in silence (paused)
    expect(result.current.state.isRunning).toBe(true);
    expect(result.current.state.phase).toBe("silence");

    // Resume
    act(() => { result.current.resumeCascade(); });
    await act(async () => { vi.advanceTimersByTime(8000); });

    // Should eventually exhaust
    expect(result.current.state.phase).toBe("idle");
  });

  it("cascade exhaustion holds idle without looping", async () => {
    const { result } = renderHook(() => useCascadeSequencer());
    const cascade: CascadeEntry[] = [
      { type: "silence", duration_seconds: 1 },
    ];

    startCascade(result.current, cascade);
    await act(async () => { vi.advanceTimersByTime(1500); });

    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.statusText).toBe("Clare's here when you're ready");

    // Wait more — should stay idle, not restart
    await act(async () => { vi.advanceTimersByTime(10000); });
    expect(result.current.state.phase).toBe("idle");
    // No audio should have been triggered
    expect(mockPlayAudio).not.toHaveBeenCalled();
  });
});
