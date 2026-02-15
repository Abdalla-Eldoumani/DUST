"use client";

import { create } from "zustand";
import type {
  PageContent,
  ArchivedItem,
  GamePhase,
  GameResult,
} from "@/lib/types";
import { GAME_CONSTANTS } from "@/lib/constants";

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
    set({
      ...initialState,
      gamePhase: "playing",
      selectedLevelId: levelId,
      selectedDifficulty: difficulty,
      currentLevel: difficulty,
      gameStartedAt: Date.now(),
      levelPages: pages,
      levelPageIndex: 0,
      currentPage: pages[0]!,
      decayProgress: 0,
      selectedSections: [],
    });
  },

  setCurrentPage: (page) =>
    set({
      currentPage: page,
      decayProgress: 0,
      selectedSections: [],
      gamePhase: "playing",
    }),

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
    const { selectedSections, currentPage, archiveEnergy } = get();
    const section = currentPage?.sections.find((s) => s.id === sectionId);
    if (!section) return;

    set({
      selectedSections: selectedSections.filter((id) => id !== sectionId),
      archiveEnergy: archiveEnergy + section.archiveCost,
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

    // Update combo
    const allCorrect = newItems.every((item) => item.wasCorrect);
    const { combo, bestCombo, score, archive } = get();
    const newCombo = allCorrect ? combo + 1 : 0;

    // Streak scaling is deterministic: streak 1 => x1, streak 2 => x2, etc.
    const comboMultiplier = allCorrect ? Math.max(newCombo, 1) : 1;
    const scoredItems = newItems.map((item) =>
      item.wasCorrect
        ? {
            ...item,
            pointsEarned: Math.round(item.pointsEarned * comboMultiplier),
          }
        : item
    );
    const roundPoints = scoredItems.reduce(
      (sum, item) => sum + item.pointsEarned,
      0
    );

    set({
      archive: [...archive, ...scoredItems],
      score: Math.max(0, score + roundPoints),
      combo: newCombo,
      bestCombo: Math.max(bestCombo, newCombo),
    });
  },

  revealResults: () => set({ gamePhase: "results" }),

  nextPage: (page) => {
    const { currentLevel, pagesCompleted, levelPages, levelPageIndex } = get();
    const newLevel = pagesCompleted >= 2 ? currentLevel + 1 : currentLevel;

    // Partial energy regen
    const maxEnergy =
      GAME_CONSTANTS.BASE_ARCHIVE_ENERGY +
      Math.floor(newLevel / 2) * GAME_CONSTANTS.ENERGY_REGEN_PER_LEVEL;

    set({
      currentPage: page,
      decayProgress: 0,
      selectedSections: [],
      currentLevel: Math.min(newLevel, GAME_CONSTANTS.MAX_LEVEL),
      archiveEnergy: maxEnergy,
      maxArchiveEnergy: maxEnergy,
      pagesCompleted: pagesCompleted + 1,
      gamePhase: "playing",
      // Increment levelPageIndex when playing a Convex level
      ...(levelPages.length > 0 ? { levelPageIndex: levelPageIndex + 1 } : {}),
    });
  },

  endGame: () => {
    const { score, archive, bestCombo, pagesCompleted, gameStartedAt } = get();
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
      pagesCompleted,
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
