"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DecayCurve } from "@/lib/constants";
import { applyDecayCurve } from "@/lib/content/difficulty";

type MilestoneCallback = () => void;

interface DecayEngineOptions {
  duration: number; // Total decay time in seconds
  curve?: DecayCurve; // Decay acceleration curve
  onProgress?: (progress: number) => void;
}

/**
 * useDecayEngine — React hook that drives the decay timer.
 *
 * Uses requestAnimationFrame for smooth 60fps updates.
 * Exposes progress (0-1), start/pause/resume/reset controls,
 * and milestone callbacks at 25%, 50%, 75%, 100%.
 */
export function useDecayEngine(options: DecayEngineOptions) {
  const { duration, curve, onProgress } = options;
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0); // elapsed ms when paused
  const rafRef = useRef<number | null>(null);
  const milestonesRef = useRef<Map<number, MilestoneCallback[]>>(new Map());
  const firedMilestonesRef = useRef<Set<number>>(new Set());
  const durationMs = duration * 1000;

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = performance.now() - startTimeRef.current + pausedAtRef.current;
    const rawP = Math.min(elapsed / durationMs, 1);
    const p = curve ? applyDecayCurve(rawP, curve) : rawP;

    setProgress(p);
    onProgress?.(p);

    // Fire milestones
    for (const [threshold, callbacks] of milestonesRef.current.entries()) {
      if (p >= threshold && !firedMilestonesRef.current.has(threshold)) {
        firedMilestonesRef.current.add(threshold);
        callbacks.forEach((cb) => cb());
      }
    }

    if (rawP < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setIsRunning(false);
    }
  }, [durationMs, curve, onProgress]);

  const start = useCallback(() => {
    firedMilestonesRef.current.clear();
    pausedAtRef.current = 0;
    startTimeRef.current = performance.now();
    setProgress(0);
    setIsRunning(true);
    setIsPaused(false);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pausedAtRef.current += performance.now() - (startTimeRef.current ?? performance.now());
    startTimeRef.current = null;
    setIsPaused(true);
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (!isPaused) return;
    startTimeRef.current = performance.now();
    setIsPaused(false);
    rafRef.current = requestAnimationFrame(tick);
  }, [isPaused, tick]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    pausedAtRef.current = 0;
    firedMilestonesRef.current.clear();
    setProgress(0);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const onMilestone = useCallback(
    (threshold: number, callback: MilestoneCallback) => {
      const existing = milestonesRef.current.get(threshold) ?? [];
      milestonesRef.current.set(threshold, [...existing, callback]);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    progress,
    isRunning,
    isPaused,
    isComplete: progress >= 1,
    /** Remaining seconds */
    remaining: Math.max(0, duration * (1 - progress)),
    start,
    pause,
    resume,
    reset,
    onMilestone,
  };
}
