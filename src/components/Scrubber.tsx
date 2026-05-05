"use client";

import { useRef, useState, useCallback } from "react";

export function Scrubber({
  progress,
  elapsedFormatted,
  remainingFormatted,
  onSeek,
}: {
  progress: number;
  elapsedFormatted: string;
  remainingFormatted: string;
  onSeek: (progress: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const displayProgress = isDragging ? dragProgress : progress;

  const getProgressFromEvent = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  // Tap to seek
  const handleClick = useCallback((e: React.MouseEvent) => {
    const p = getProgressFromEvent(e.clientX);
    onSeek(p);
  }, [getProgressFromEvent, onSeek]);

  // Drag start (mouse)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragProgress(getProgressFromEvent(e.clientX));

    const onMove = (ev: MouseEvent) => {
      setDragProgress(getProgressFromEvent(ev.clientX));
    };
    const onUp = (ev: MouseEvent) => {
      const p = getProgressFromEvent(ev.clientX);
      setIsDragging(false);
      onSeek(p);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [getProgressFromEvent, onSeek]);

  // Drag start (touch)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragProgress(getProgressFromEvent(e.touches[0].clientX));
  }, [getProgressFromEvent]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragProgress(getProgressFromEvent(e.touches[0].clientX));
  }, [isDragging, getProgressFromEvent]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    onSeek(dragProgress);
  }, [isDragging, dragProgress, onSeek]);

  return (
    <div className="mb-2">
      {/* Track — enlarged touch area */}
      <div
        ref={trackRef}
        className="relative cursor-pointer py-2"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background track */}
        <div className="h-[3px] w-full rounded-full bg-[#443B31]">
          {/* Fill */}
          <div
            className="h-full rounded-full bg-[#C9944A]"
            style={{ width: `${displayProgress * 100}%`, transition: isDragging ? "none" : "width 200ms" }}
          />
        </div>
        {/* Scrubber dot */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-[#F5F0EB] shadow-sm ${
            isDragging ? "h-[14px] w-[14px]" : "h-[10px] w-[10px]"
          }`}
          style={{
            left: `calc(${displayProgress * 100}% - ${isDragging ? 7 : 5}px)`,
            transition: isDragging ? "none" : "left 200ms",
          }}
        />
      </div>

      {/* Timestamps */}
      <div className="flex justify-between">
        <span className="text-[10px] tabular-nums text-[#887B6C]">
          {elapsedFormatted}
        </span>
        <span className="text-[10px] tabular-nums text-[#887B6C]">
          {remainingFormatted}
        </span>
      </div>
    </div>
  );
}
