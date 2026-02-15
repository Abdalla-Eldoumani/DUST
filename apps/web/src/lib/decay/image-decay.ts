"use client";

import { useMemo } from "react";

export interface ImageDecayStyle {
  filter: string;
  opacity: number;
  imageRendering?: string;
  transform?: string;
}

/**
 * Compute CSS filter/style values for image decay at a given progress.
 *
 * Progress 0.0-0.3: Slight warmth, no degradation
 * Progress 0.3-0.5: Fading, slight desaturation
 * Progress 0.5-0.7: Heavy degradation, blur begins
 * Progress 0.7-0.9: Almost gone, heavy blur, desaturated
 * Progress 0.9-1.0: Fully decayed (invisible)
 */
export function computeImageDecay(progress: number): ImageDecayStyle {
  if (progress <= 0.1) {
    return { filter: "none", opacity: 1 };
  }

  if (progress <= 0.3) {
    const t = (progress - 0.1) / 0.2;
    return {
      filter: `brightness(${1 + t * 0.1}) contrast(${1 - t * 0.05}) saturate(${1 - t * 0.15})`,
      opacity: 1,
    };
  }

  if (progress <= 0.5) {
    const t = (progress - 0.3) / 0.2;
    return {
      filter: `brightness(${1.1 - t * 0.2}) contrast(${0.95 - t * 0.15}) saturate(${0.85 - t * 0.35}) blur(${t * 0.5}px)`,
      opacity: 1 - t * 0.1,
    };
  }

  if (progress <= 0.7) {
    const t = (progress - 0.5) / 0.2;
    return {
      filter: `brightness(${0.9 - t * 0.3}) contrast(${0.8 - t * 0.2}) saturate(${0.5 - t * 0.3}) blur(${0.5 + t * 1.5}px)`,
      opacity: 0.9 - t * 0.2,
      imageRendering: t > 0.5 ? "pixelated" : undefined,
    };
  }

  if (progress <= 0.9) {
    const t = (progress - 0.7) / 0.2;
    return {
      filter: `brightness(${0.6 - t * 0.3}) contrast(${0.6 - t * 0.2}) saturate(0) blur(${2 + t * 2}px)`,
      opacity: 0.7 - t * 0.4,
      imageRendering: "pixelated",
      transform: `scale(${1 + t * 0.02})`,
    };
  }

  // 0.9 - 1.0: fade to nothing
  const t = (progress - 0.9) / 0.1;
  return {
    filter: `brightness(0.3) contrast(0.4) saturate(0) blur(${4 + t * 2}px)`,
    opacity: Math.max(0.3 - t * 0.3, 0),
    imageRendering: "pixelated",
  };
}

/**
 * React hook for image decay styles. Memoized.
 */
export function useImageDecay(progress: number): ImageDecayStyle {
  return useMemo(
    () => computeImageDecay(progress),
    [Math.round(progress * 30)] // eslint-disable-line react-hooks/exhaustive-deps
  );
}
