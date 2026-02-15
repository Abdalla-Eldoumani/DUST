"use client";

import { useMemo } from "react";

export interface ColorDecayStyle {
  filter: string;
  mixBlendMode?: string;
}

/**
 * Compute CSS filter for progressive color decay.
 * Colors desaturate and shift hue as decay progresses.
 *
 * Progress 0.0-0.2: Normal colors
 * Progress 0.2-0.5: Gradual desaturation, slight sepia tint
 * Progress 0.5-0.8: Heavy desaturation, hue shift, contrast loss
 * Progress 0.8-1.0: Nearly monochrome, heavy color bleed
 */
export function computeColorDecay(progress: number): ColorDecayStyle {
  if (progress <= 0.15) {
    return { filter: "none" };
  }

  if (progress <= 0.4) {
    const t = (progress - 0.15) / 0.25;
    return {
      filter: `saturate(${1 - t * 0.4}) sepia(${t * 0.15}) hue-rotate(${t * 5}deg)`,
    };
  }

  if (progress <= 0.7) {
    const t = (progress - 0.4) / 0.3;
    return {
      filter: `saturate(${0.6 - t * 0.4}) sepia(${0.15 + t * 0.2}) hue-rotate(${5 + t * 15}deg) contrast(${1 - t * 0.15})`,
    };
  }

  // 0.7 - 1.0
  const t = (progress - 0.7) / 0.3;
  return {
    filter: `saturate(${0.2 - t * 0.2}) sepia(${0.35 + t * 0.15}) hue-rotate(${20 + t * 10}deg) contrast(${0.85 - t * 0.25}) brightness(${1 - t * 0.3})`,
  };
}

/**
 * React hook for color decay styles. Memoized.
 */
export function useColorDecay(progress: number): ColorDecayStyle {
  return useMemo(
    () => computeColorDecay(progress),
    [Math.round(progress * 25)] // eslint-disable-line react-hooks/exhaustive-deps
  );
}
