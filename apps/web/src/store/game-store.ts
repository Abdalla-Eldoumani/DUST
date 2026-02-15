"use client";

import { create } from "zustand";
import type {
  PageContent,
  ArchivedItem,
  GamePhase,
  GameResult,
} from "@/lib/types";
import { GAME_CONSTANTS } from "@/lib/constants";

/** Count true sections — used to set archive energy budget. */
function countTrueSections(page: PageContent): number {
  return page.sections.filter((s) => s.isTrue).length;
}

interface GameState {
  // Game phase
  gamePhase: GamePhase;
  demoMode: boolean;

  // Level & score
  currentLevel: number;
  selectedLevelId: string | null;
  selectedDifficulty: number | null;
  score: number;
  combo: number;
  bestCombo: number;
  lastGameResult: GameResult | null;

  // Archive energy
  archiveEnergy: number;
  maxArchiveEnergy: number;

  // Current page
  currentPage: PageContent | null;
  decayProgress: number;

  // Player selections
  selectedSections: string[];

  // Archive history
  archive: ArchivedItem[];

  // Timing
  gameStartedAt: number | null;
  pagesCompleted: number;

  // Convex variant pages loaded for current level
  levelPages: PageContent[];
  levelPageIndex: number;

  // Actions
  startGame: (demoMode?: boolean) => void;
  startLevelGame: (levelId: string, difficulty: number, pages: PageContent[]) => void;
  setCurrentPage: (page: PageContent) => void;
  setDecayProgress: (progress: number) => void;
  selectSection: (sectionId: string) => void;
  deselectSection: (sectionId: string) => void;
  archiveSelected: () => void;
  revealResults: () => void;
  nextPage: (page: PageContent) => void;
  endGame: () => GameResult;
  resetGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
}

const initialState = {
  gamePhase: "menu" as GamePhase,
  demoMode: false,
  currentLevel: 1,
  selectedLevelId: null as string | null,
  selectedDifficulty: null as number | null,
  score: 0,
  combo: 0,
  bestCombo: 0,
  lastGameResult: null as GameResult | null,
  archiveEnergy: GAME_CONSTANTS.BASE_ARCHIVE_ENERGY,
  maxArchiveEnergy: GAME_CONSTANTS.BASE_ARCHIVE_ENERGY,
  currentPage: null as PageContent | null,
  decayProgress: 0,
  selectedSections: [] as string[],
  archive: [] as ArchivedItem[],
  gameStartedAt: null as number | null,
  pagesCompleted: 0,
  levelPages: [] as PageContent[],
  levelPageIndex: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  startGame: (demoMode = false) =>
    set({
      ...initialState,
      gamePhase: "loading",
      demoMode,
      gameStartedAt: Date.now(),
    }),

  startLevelGame: (levelId, difficulty, pages) => {
    if (pages.length === 0) return;
    const energy = countTrueSections(pages[0]!);
    const firstPage = pages[0]!;
    set({
      ...initialState,
      gamePhase: "playing",
      selectedLevelId: levelId,
      selectedDifficulty: difficulty,
      currentLevel: difficulty,
      gameStartedAt: Date.now(),
      levelPages: pages,
      levelPageIndex: 0,
      currentPage: firstPage,
      decayProgress: 0,
      selectedSections: [],
      archiveEnergy: energy,
      maxArchiveEnergy: energy,
    });
  },

  setCurrentPage: (page) => {
    const energy = countTrueSections(page);
    set({
      currentPage: page,
      decayProgress: 0,
      selectedSections: [],
      gamePhase: "playing",
      archiveEnergy: energy,
      maxArchiveEnergy: energy,
    });
  },

  setDecayProgress: (progress) => set({ decayProgress: progress }),

  selectSection: (sectionId) => {
    const { selectedSections, currentPage, archiveEnergy } = get();
    if (selectedSections.includes(sectionId)) return;

    const section = currentPage?.sections.find((s) => s.id === sectionId);
    if (!section) return;
    if (archiveEnergy < section.archiveCost) return;

    set({
      selectedSections: [...selectedSections, sectionId],
      archiveEnergy: archiveEnergy - section.archiveCost,
    });
  },

  deselectSection: (sectionId) => {
    const { selectedSections, currentPage, archiveEnergy, maxArchiveEnergy } = get();
    const section = currentPage?.sections.find((s) => s.id === sectionId);
    if (!section) return;

    set({
      selectedSections: selectedSections.filter((id) => id !== sectionId),
      archiveEnergy: Math.min(maxArchiveEnergy, archiveEnergy + section.archiveCost),
    });
  },

  archiveSelected: () => {
    const { selectedSections, currentPage, decayProgress, currentLevel } =
      get();
    if (!currentPage || selectedSections.length === 0) return;

    set({ gamePhase: "revealing" });

    // Score each selected section
    const newItems: ArchivedItem[] = selectedSections.map((sectionId) => {
      const section = currentPage.sections.find((s) => s.id === sectionId);
      if (!section)
        return {
          sectionId,
          sectionText: "",
          wasCorrect: false,
          pointsEarned: 0,
          level: currentLevel,
          timestamp: Date.now(),
        };

      const wasCorrect = section.isTrue;
      let points = wasCorrect
        ? GAME_CONSTANTS.CORRECT_ARCHIVE_POINTS
        : GAME_CONSTANTS.MISINFO_ARCHIVE_PENALTY;

      // Clutch save bonus
      if (wasCorrect && decayProgress >= 0.9) {
        points += GAME_CONSTANTS.CLUTCH_SAVE_BONUS;
      }

      return {
        sectionId,
        sectionText: section.text,
        wasCorrect,
        pointsEarned: points,
        level: currentLevel,
        timestamp: Date.now(),
      };
    });

    // Update score/combo deterministically per section.
    // Multiplier follows COMBO_MULTIPLIER_INCREMENT:
    // streak 1 => x1.00, streak 2 => x1.25, streak 3 => x1.50, etc.
    const { combo, bestCombo, score, archive } = get();
    let runningCombo = combo;
    let peakCombo = bestCombo;
    const scoredItems = newItems.map((item) => {
      if (!item.wasCorrect) {
        runningCombo = 0;
        return item;
      }

      const comboMultiplier =
        1 + Math.max(0, runningCombo) * GAME_CONSTANTS.COMBO_MULTIPLIER_INCREMENT;
      const boostedPoints = Math.round(item.pointsEarned * comboMultiplier);

      runningCombo += 1;
      peakCombo = Math.max(peakCombo, runningCombo);

      return {
        ...item,
        pointsEarned: boostedPoints,
      };
    });
    const roundPoints = scoredItems.reduce(
      (sum, item) => sum + item.pointsEarned,
      0
    );

    set({
      archive: [...archive, ...scoredItems],
      score: score + roundPoints,
      combo: runningCombo,
      bestCombo: peakCombo,
    });
  },

  revealResults: () => set({ gamePhase: "results" }),

  nextPage: (page) => {
    const { currentLevel, pagesCompleted, levelPages, levelPageIndex } = get();
    const newLevel = pagesCompleted >= 2 ? currentLevel + 1 : currentLevel;

    // Energy = number of true sections on the new page
    const energy = countTrueSections(page);

    set({
      currentPage: page,
      decayProgress: 0,
      selectedSections: [],
      currentLevel: Math.min(newLevel, GAME_CONSTANTS.MAX_LEVEL),
      archiveEnergy: energy,
      maxArchiveEnergy: energy,
      pagesCompleted: pagesCompleted + 1,
      gamePhase: "playing",
      // Increment levelPageIndex when playing a Convex level
      ...(levelPages.length > 0 ? { levelPageIndex: levelPageIndex + 1 } : {}),
    });
  },

  endGame: () => {
    const { score, archive, bestCombo, pagesCompleted, gameStartedAt, currentPage } = get();
    const correctItems = archive.filter((a) => a.wasCorrect).length;
    const accuracy =
      archive.length > 0
        ? Math.round((correctItems / archive.length) * 100)
        : 0;
    const timePlayed = gameStartedAt
      ? Math.round((Date.now() - gameStartedAt) / 1000)
      : 0;

    const result: GameResult = {
      totalScore: score,
      accuracy,
      pagesCompleted: Math.max(0, pagesCompleted + (currentPage ? 1 : 0)),
      totalArchived: archive.length,
      bestCombo,
      timePlayed,
      level: get().currentLevel,
    };

    set({
      gamePhase: "gameover",
      lastGameResult: result,
    });
    return result;
  },

  resetGame: () => set(initialState),

  setGamePhase: (phase) => set({ gamePhase: phase }),
}));
