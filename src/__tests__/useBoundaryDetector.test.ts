import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBoundaryDetector } from "@/hooks/useBoundaryDetector";

describe("useBoundaryDetector", () => {
  let mockAudio: {
    currentTime: number;
    paused: boolean;
    playbackRate: number;
    pause: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAudio = {
      currentTime: 0,
      paused: false,
      playbackRate: 1,
      pause: vi.fn(),
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when audio is null", () => {
    const onBoundary = vi.fn();
    renderHook(() => useBoundaryDetector(null, 10, 0, onBoundary));
    vi.advanceTimersByTime(5000);
    expect(onBoundary).not.toHaveBeenCalled();
  });

  it("does nothing when endTime is null", () => {
    const onBoundary = vi.fn();
    renderHook(() =>
      useBoundaryDetector(mockAudio as unknown as HTMLAudioElement, null, null, onBoundary)
    );
    vi.advanceTimersByTime(5000);
    expect(onBoundary).not.toHaveBeenCalled();
  });

  it("fires onBoundary via setTimeout fallback when currentTime reaches endTime", () => {
    const onBoundary = vi.fn();
    mockAudio.currentTime = 8;

    renderHook(() =>
      useBoundaryDetector(mockAudio as unknown as HTMLAudioElement, 10, 5, onBoundary)
    );

    mockAudio.currentTime = 10.1;
    vi.advanceTimersByTime(3000);

    expect(onBoundary).toHaveBeenCalledTimes(1);
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("waits until audio is in chunk range before detecting", () => {
    const onBoundary = vi.fn();
    // Audio is at 300 (from cascade) but chunk is 20-30
    mockAudio.currentTime = 300;

    renderHook(() =>
      useBoundaryDetector(mockAudio as unknown as HTMLAudioElement, 30, 20, onBoundary)
    );

    // Should not fire — currentTime is way outside chunk range
    vi.advanceTimersByTime(2000);
    expect(onBoundary).not.toHaveBeenCalled();

    // Now simulate seek completing
    mockAudio.currentTime = 25;
    vi.advanceTimersByTime(500);
    expect(onBoundary).not.toHaveBeenCalled(); // not at end yet

    mockAudio.currentTime = 30;
    vi.advanceTimersByTime(500);
    expect(onBoundary).toHaveBeenCalledTimes(1);
  });

  it("does not fire twice (generation guard)", () => {
    const onBoundary = vi.fn();
    mockAudio.currentTime = 9.9;

    renderHook(() =>
      useBoundaryDetector(mockAudio as unknown as HTMLAudioElement, 10, 5, onBoundary)
    );

    mockAudio.currentTime = 10.5;
    vi.advanceTimersByTime(500);
    vi.advanceTimersByTime(500);
    vi.advanceTimersByTime(500);

    expect(onBoundary).toHaveBeenCalledTimes(1);
  });

  it("cleans up on unmount", () => {
    const onBoundary = vi.fn();
    mockAudio.currentTime = 5;

    const { unmount } = renderHook(() =>
      useBoundaryDetector(mockAudio as unknown as HTMLAudioElement, 10, 5, onBoundary)
    );

    unmount();
    mockAudio.currentTime = 11;
    vi.advanceTimersByTime(6000);

    expect(onBoundary).not.toHaveBeenCalled();
  });
});
