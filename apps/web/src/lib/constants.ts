export const GAME_CONSTANTS = {
  // Scoring
  CORRECT_ARCHIVE_POINTS: 100,
  MISINFO_ARCHIVE_PENALTY: -150,
  CLUTCH_SAVE_BONUS: 50, // Archived in last 10% of decay
  COMBO_MULTIPLIER_INCREMENT: 0.25, // Each consecutive correct +25%

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
