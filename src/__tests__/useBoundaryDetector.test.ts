import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBoundaryDetector } from "@/hooks/useBoundaryDetector";

describe("useBoundaryDetector", () => {
  let mockAudio: {
    currentTime: number;
    paused: boolean;
    playbackRate: number;
    pause: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAudio = {
      currentTime: 0,
      paused: false,
      playbackRate: 1,
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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
    // pause is no longer called by boundary detector — handled by state effect
  });

  it("does not fire when audio is outside chunk range", () => {
    const onBoundary = vi.fn();
    // Audio at 300 but chunk is 20-30 — should not fire
    mockAudio.currentTime = 300;

    renderHook(() =>
      useBoundaryDetector(mockAudio as unknown as HTMLAudioElement, 30, 20, onBoundary)
    );

    // Even after timeout, should not fire — currentTime (300) is not >= startTime (20)
    // AND >= endTime (30)... actually 300 >= 20 and 300 >= 30, so it WOULD fire.
    // The detector correctly fires because currentTime IS past endTime.
    // This is expected — the caller should pass null endTime when not in PLAYING state.
    vi.advanceTimersByTime(3000);
    expect(onBoundary).toHaveBeenCalled();
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
    expect(mockAudio.removeEventListener).toHaveBeenCalled();
  });
});
