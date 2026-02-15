"use client";

import { useMemo } from "react";

// Block characters that look intentional and artistic, not broken
export const DECAY_CHARS = "░▒▓█╳╱╲◻◼▪▫◇◆●○◌▢⌧⍜⎔".split("");

// Deterministic pseudo-random based on char index + seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/**
 * Compute the decay threshold for a character based on its position
 * and the section's decay order. Characters in sections with lower
 * decayOrder start decaying earlier.
 */
function charDecayThreshold(
  charIndex: number,
  textLength: number,
  decayOrder: number = 3
): number {
  // decayOrder 1 = decays first (threshold ~0.1), 5 = decays last (threshold ~0.7)
  const orderOffset = 0.1 + (decayOrder - 1) * 0.15;
  // Spread within the section: some chars go earlier, some later
  const charSpread = seededRandom(charIndex * 7 + textLength) * 0.3;
  return Math.min(orderOffset + charSpread, 0.95);
}

/**
 * Apply text decay to a string. Returns a new string with characters
 * progressively replaced by block/glitch characters.
 *
 * @param text - Original text
 * @param progress - Decay progress 0.0 (pristine) to 1.0 (fully decayed)
 * @param decayOrder - 1 (decays first) to 5 (decays last)
 */
export function decayText(
  text: string,
  progress: number,
  decayOrder: number = 3
): string {
  if (progress <= 0.05) return text;
  if (progress >= 0.98) {
    // Nearly fully decayed — sparse fragments
    return text
      .split("")
      .map((ch, i) => {
        if (ch === " " || ch === "\n") return ch;
        return seededRandom(i * 13) > 0.9
          ? DECAY_CHARS[Math.floor(seededRandom(i * 31) * DECAY_CHARS.length)]
          : " ";
      })
      .join("");
  }

  return text
    .split("")
    .map((char, i) => {
      // Preserve whitespace
      if (char === " " || char === "\n" || char === "\t") return char;

      const threshold = charDecayThreshold(i, text.length, decayOrder);

      if (progress < threshold) return char;

      // How far past the threshold are we? Determines glitch intensity
      const intensity = (progress - threshold) / (1 - threshold);

      if (intensity < 0.3) {
        // Light corruption: occasionally swap case or shift char
        return seededRandom(i * 17 + progress * 100) > 0.5
          ? char
          : DECAY_CHARS[Math.floor(seededRandom(i * 23) * DECAY_CHARS.length)];
      }

      // Heavy corruption: replace with block character
      return DECAY_CHARS[
        Math.floor(seededRandom(i * 31 + Math.floor(progress * 10)) * DECAY_CHARS.length)
      ];
    })
    .join("");
}

/**
 * React hook for text decay. Memoized for performance.
 */
export function useTextDecay(
  text: string,
  progress: number,
  decayOrder: number = 3
): string {
  return useMemo(
    () => decayText(text, progress, decayOrder),
    // Quantize progress to reduce re-computations (update every ~2%)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, Math.round(progress * 50), decayOrder]
  );
}
