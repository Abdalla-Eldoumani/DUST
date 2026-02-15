import { GAME_CONSTANTS } from "@/lib/constants";

export interface DifficultyConfig {
  decayDuration: number;
  misinfoCount: number;
  energyBudget: number;
  label: string;
}

/**
 * Maps level number to game difficulty parameters.
 */
export function getDifficulty(level: number): DifficultyConfig {
  const clampedLevel = Math.min(level, GAME_CONSTANTS.MAX_LEVEL);

  const decayDuration = Math.round(
    Math.max(
      GAME_CONSTANTS.BASE_DECAY_DURATION -
        (clampedLevel - 1) * GAME_CONSTANTS.DECAY_REDUCTION_PER_LEVEL,
      GAME_CONSTANTS.MIN_DECAY_DURATION
    )
  );

  let misinfoCount: number;
  let label: string;

  if (clampedLevel <= 3) {
    misinfoCount = GAME_CONSTANTS.MISINFO_SECTIONS_EASY;
    label = "Easy";
  } else if (clampedLevel <= 6) {
    misinfoCount = GAME_CONSTANTS.MISINFO_SECTIONS_MEDIUM;
    label = "Medium";
  } else {
    misinfoCount = GAME_CONSTANTS.MISINFO_SECTIONS_HARD;
    label = "Hard";
  }

  const energyBudget =
    GAME_CONSTANTS.BASE_ARCHIVE_ENERGY +
    Math.floor(clampedLevel / 2) * GAME_CONSTANTS.ENERGY_REGEN_PER_LEVEL;

  return { decayDuration, misinfoCount, energyBudget, label };
}
