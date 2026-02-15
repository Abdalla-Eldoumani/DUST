"use client";

import { useMemo } from "react";

export interface LayoutDecayStyle {
  transform: string;
  opacity: number;
  filter?: string;
  transition?: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/**
 * Compute CSS transform/style for layout disruption at a given progress.
 * Each element gets a slightly different disruption based on its index.
 *
 * Progress 0.0-0.3: No transformation
 * Progress 0.3-0.5: Subtle skew, slight translate
 * Progress 0.5-0.7: Increased skew, opacity flickering
 * Progress 0.7-0.9: Major disruption, sections drifting
 * Progress 0.9-1.0: Complete collapse
 */
export function computeLayoutDecay(
  progress: number,
  elementIndex: number = 0
): LayoutDecayStyle {
  if (progress <= 0.3) {
    return { transform: "none", opacity: 1 };
  }

  const seed = elementIndex * 37;
  const randomX = (seededRandom(seed) - 0.5) * 2;
  const randomY = (seededRandom(seed + 1) - 0.5) * 2;
  const randomSkew = (seededRandom(seed + 2) - 0.5) * 2;

  if (progress <= 0.5) {
    const t = (progress - 0.3) / 0.2;
    return {
      transform: `skew(${randomSkew * t * 0.5}deg) translate(${randomX * t * 2}px, ${randomY * t}px)`,
      opacity: 1,
    };
  }

  if (progress <= 0.7) {
    const t = (progress - 0.5) / 0.2;
    // Flickering opacity
    const flicker = seededRandom(seed + Math.floor(progress * 30)) > 0.8 ? 0.7 : 1;
    return {
      transform: `skew(${randomSkew * (0.5 + t * 1.5)}deg) translate(${randomX * (2 + t * 6)}px, ${randomY * (1 + t * 4)}px)`,
      opacity: (1 - t * 0.2) * flicker,
      filter: t > 0.5 ? `blur(${(t - 0.5) * 1}px)` : undefined,
    };
  }

  if (progress <= 0.9) {
    const t = (progress - 0.7) / 0.2;
    const flicker = seededRandom(seed + Math.floor(progress * 20)) > 0.6 ? 0.5 : 1;
    return {
      transform: `skew(${randomSkew * (2 + t * 3)}deg) translate(${randomX * (8 + t * 20)}px, ${randomY * (5 + t * 15)}px) rotate(${randomSkew * t * 2}deg)`,
      opacity: (0.8 - t * 0.4) * flicker,
      filter: `blur(${0.5 + t * 1.5}px)`,
    };
  }

  // 0.9 - 1.0: collapse
  const t = (progress - 0.9) / 0.1;
  return {
    transform: `skew(${randomSkew * 5}deg) translate(${randomX * 30}px, ${randomY * 20 + t * 40}px) rotate(${randomSkew * 4}deg) scale(${1 - t * 0.3})`,
    opacity: Math.max(0.4 - t * 0.4, 0),
    filter: `blur(${2 + t * 3}px)`,
  };
}

/**
 * React hook for layout decay. Memoized.
 */
export function useLayoutDecay(
  progress: number,
  elementIndex: number = 0
): LayoutDecayStyle {
  return useMemo(
    () => computeLayoutDecay(progress, elementIndex),
    [Math.round(progress * 30), elementIndex] // eslint-disable-line react-hooks/exhaustive-deps
  );
}
