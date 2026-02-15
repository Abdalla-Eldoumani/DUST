export const GAME_CONSTANTS = {
  // Scoring
  CORRECT_ARCHIVE_POINTS: 100,
  MISINFO_ARCHIVE_PENALTY: -150,
  CLUTCH_SAVE_BONUS: 50, // Archived in last 10% of decay
  COMBO_MULTIPLIER_INCREMENT: 0.25, // Each consecutive correct +25%
  TIMEOUT_NO_ARCHIVE_PENALTY: -400, // No selections before decay completes

  // Energy
  BASE_ARCHIVE_ENERGY: 5,
  ENERGY_REGEN_PER_LEVEL: 2,

  // Decay
  BASE_DECAY_DURATION: 60, // Seconds for level 1
  DECAY_REDUCTION_PER_LEVEL: 5, // Seconds faster per level
  MIN_DECAY_DURATION: 15, // Never faster than 15s

  // Difficulty
  MAX_LEVEL: 10,
  MISINFO_SECTIONS_EASY: 1, // Level 1-3
  MISINFO_SECTIONS_MEDIUM: 2, // Level 4-6
  MISINFO_SECTIONS_HARD: 3, // Level 7+
} as const;

/**
 * 4-tier difficulty configuration with decay curves.
 * Each tier defines duration, delay, curve, and tool charges.
 */
export const DIFFICULTY_CONFIG = {
  easy: {
    levels: [1, 2, 3],
    decayDuration: 60,
    decayStartDelay: 3,
    decayCurve: "linear" as const,
    sectionCount: 5,
    archiveEnergy: 5,
    toolCharges: 4,
    label: "Easy",
  },
  medium: {
    levels: [4, 5, 6],
    decayDuration: 40,
    decayStartDelay: 2,
    decayCurve: "ease-in" as const,
    sectionCount: 6,
    archiveEnergy: 5,
    toolCharges: 3,
    label: "Medium",
  },
  hard: {
    levels: [7, 8, 9],
    decayDuration: 25,
    decayStartDelay: 1,
    decayCurve: "ease-in-quad" as const,
    sectionCount: 7,
    archiveEnergy: 4,
    toolCharges: 2,
    label: "Hard",
  },
  expert: {
    levels: [10],
    decayDuration: 18,
    decayStartDelay: 0,
    decayCurve: "ease-in-cubic" as const,
    sectionCount: 7,
    archiveEnergy: 3,
    toolCharges: 1,
    label: "Expert",
  },
} as const;

export type DecayCurve = typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]["decayCurve"];
