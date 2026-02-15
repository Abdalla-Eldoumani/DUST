import { GAME_CONSTANTS, DIFFICULTY_CONFIG, type DecayCurve } from "@/lib/constants";

export interface DifficultyConfig {
  decayDuration: number;
  decayStartDelay: number;
  decayCurve: DecayCurve;
  misinfoCount: number;
  energyBudget: number;
  toolCharges: number;
  label: string;
}

/**
 * Maps level number to game difficulty parameters using the 4-tier config.
 */
export function getDifficulty(level: number): DifficultyConfig {
  const clampedLevel = Math.min(level, GAME_CONSTANTS.MAX_LEVEL);

  // Find matching tier
  const tier = clampedLevel <= 3
    ? DIFFICULTY_CONFIG.easy
    : clampedLevel <= 6
      ? DIFFICULTY_CONFIG.medium
      : clampedLevel <= 9
        ? DIFFICULTY_CONFIG.hard
        : DIFFICULTY_CONFIG.expert;

  // Fine-tune duration within tier based on exact level
  const tierBase = tier.levels[0]!;
  const withinTierOffset = clampedLevel - tierBase;
  const decayDuration = Math.max(
    tier.decayDuration - withinTierOffset * 3,
    GAME_CONSTANTS.MIN_DECAY_DURATION
  );

  let misinfoCount: number;
  if (clampedLevel <= 3) {
    misinfoCount = GAME_CONSTANTS.MISINFO_SECTIONS_EASY;
  } else if (clampedLevel <= 6) {
    misinfoCount = GAME_CONSTANTS.MISINFO_SECTIONS_MEDIUM;
  } else {
    misinfoCount = GAME_CONSTANTS.MISINFO_SECTIONS_HARD;
  }

  return {
    decayDuration,
    decayStartDelay: tier.decayStartDelay,
    decayCurve: tier.decayCurve,
    misinfoCount,
    energyBudget: tier.archiveEnergy,
    toolCharges: tier.toolCharges,
    label: tier.label,
  };
}

/**
 * Applies a decay curve to raw linear progress (0-1).
 * Returns curved progress value (0-1).
 */
export function applyDecayCurve(rawProgress: number, curve: DecayCurve): number {
  const p = Math.max(0, Math.min(1, rawProgress));
  switch (curve) {
    case "linear":
      return p;
    case "ease-in":
      // Quadratic-ish ease-in: slow start, accelerating decay
      return p * p * (3 - 2 * p); // smoothstep for gentle ease
    case "ease-in-quad":
      // Quadratic: decay accelerates
      return p * p;
    case "ease-in-cubic":
      // Cubic: even more dramatic acceleration
      return p * p * p;
    default:
      return p;
  }
}
