"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { useGameStore } from "@/store/game-store";
import { useDecayEngine } from "@/lib/decay/decay-engine";
import { getRandomCachedPage } from "@/lib/content/content-cache";
import { getDemoPage } from "@/lib/content/demo-content";
import { getDifficulty } from "@/lib/content/difficulty";
import { variantToPageContent, type ConvexVariant } from "@/lib/content/convex-adapter";

import { NewsArticle } from "@/components/game/fake-page/news-article";
import { BlogPost } from "@/components/game/fake-page/blog-post";
import { SocialThread } from "@/components/game/fake-page/social-thread";
import { WikiArticle } from "@/components/game/fake-page/wiki-article";

import { LevelSelector } from "@/components/game/level-selector";
import { DecayTimer } from "@/components/game/decay-timer";
import { ToolPanel } from "@/components/game/tools/tool-panel";
import { EnergyBar } from "@/components/game/archive/energy-bar";
import { ArchiveButton } from "@/components/game/archive/archive-button";
import { ScoreDisplay } from "@/components/game/scoring/score-display";
import { RevealScreen } from "@/components/game/scoring/reveal-screen";
import { GameOverScreen } from "@/components/game/scoring/game-over-screen";
import { ParticleField } from "@/components/ui/particle-field";

import type { ArchivedItem, PageContent } from "@/lib/types";
import { GAME_CONSTANTS } from "@/lib/constants";

export default function PlayPage() {
  const store = useGameStore();
  const usedIdsRef = useRef<string[]>([]);
  const [timeoutReveal, setTimeoutReveal] = useState<{
    items: ArchivedItem[];
    roundScore: number;
  } | null>(null);
  const [screenShake, setScreenShake] = useState(false);

  // Level selection state — set when user picks a level from LevelSelector
  const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);
  const [pendingDifficulty, setPendingDifficulty] = useState<number>(1);
  const [levelError, setLevelError] = useState<string | null>(null);

  // Query variants for the selected level (skips when no level selected)
  const levelVariants = useQuery(
    api.pageVariants.getByLevelId,
    pendingLevelId ? { levelId: pendingLevelId } : "skip"
  );

  const difficulty = useMemo(
    () => getDifficulty(store.currentLevel),
    [store.currentLevel]
  );

  const decayEngine = useDecayEngine({
    duration: store.currentPage?.decayDuration ?? difficulty.decayDuration,
    onProgress: store.setDecayProgress,
  });

  // When variants arrive for a pending level, convert and start the game.
  useEffect(() => {
    if (pendingLevelId && levelVariants) {
      const matchingVariants = levelVariants.filter(
        (v) => (v as unknown as ConvexVariant).levelId === pendingLevelId
      );
      const pages = matchingVariants.map((v) =>
        variantToPageContent(v as unknown as ConvexVariant)
      );
      console.log(
        `[DUST] Level ${pendingLevelId}: ${matchingVariants.length} variants loaded, ${pages.length} pages converted`
      );
      if (pages.length > 0) {
        setLevelError(null);
        store.startLevelGame(pendingLevelId, pendingDifficulty, pages);
      } else {
        console.warn(`[DUST] Level ${pendingLevelId}: no variants found`);
        setLevelError("This level has no generated pages yet. Try another level or Quick Play.");
      }
      setPendingLevelId(null);
      setPendingDifficulty(1);
    }
  }, [levelVariants, pendingLevelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load first page when game starts (quick play / demo mode — no level selected)
  useEffect(() => {
    if (store.gamePhase === "loading" && !pendingLevelId) {
      const page = store.demoMode
        ? getDemoPage(0)
        : getRandomCachedPage(usedIdsRef.current, store.currentLevel);
      usedIdsRef.current.push(page.id);
      store.setCurrentPage(page);
    }
  }, [store.gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start decay when page is loaded
  useEffect(() => {
    if (store.gamePhase === "playing" && store.currentPage) {
      decayEngine.reset();
      decayEngine.start();
    }
  }, [store.gamePhase, store.currentPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screen shake when decay crosses 75%
  useEffect(() => {
    if (store.decayProgress >= 0.75 && store.decayProgress < 0.78 && store.gamePhase === "playing") {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 400);
    }
  }, [Math.round(store.decayProgress * 30)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-archive (or force penalty reveal) when decay completes
  useEffect(() => {
    if (decayEngine.isComplete && store.gamePhase === "playing") {
      if (store.selectedSections.length > 0) {
        handleArchive();
      } else {
        handleTimeoutWithoutArchive();
      }
    }
  }, [decayEngine.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSectionSelect = useCallback(
    (sectionId: string) => {
      if (store.selectedSections.includes(sectionId)) {
        store.deselectSection(sectionId);
      } else {
        store.selectSection(sectionId);
      }
    },
    [store]
  );

  const handleArchive = useCallback(() => {
    decayEngine.pause();
    setTimeoutReveal(null);
    store.archiveSelected();
  }, [decayEngine, store]);

  const handleTimeoutWithoutArchive = useCallback(() => {
    decayEngine.pause();
    if (!store.currentPage) return;

    const timedOutItems: ArchivedItem[] = store.currentPage.sections.map((section) => ({
      sectionId: section.id,
      sectionText: section.text,
      wasCorrect: false,
      pointsEarned: -GAME_CONSTANTS.CORRECT_ARCHIVE_POINTS,
      level: store.currentLevel,
      timestamp: Date.now(),
    }));

    const roundScore = timedOutItems.reduce((sum, item) => sum + item.pointsEarned, 0);

    useGameStore.setState((state) => ({
      score: Math.max(0, state.score + roundScore),
      combo: 0,
      gamePhase: "revealing",
    }));

    setTimeoutReveal({ items: timedOutItems, roundScore });
  }, [decayEngine, store.currentLevel, store.currentPage]);

  const handleNextPage = useCallback(() => {
    setTimeoutReveal(null);

    // If playing a selected level, use pre-loaded levelPages
    if (store.levelPages.length > 0) {
      const nextIndex = store.levelPageIndex + 1;
      console.log("NEXTINDEX:",nextIndex)
      console.log("LEVELPAGES:", store.levelPages.length)
      if (nextIndex >= store.levelPages.length) {
        store.endGame();
        return;
      }
      const nextPage = store.levelPages[nextIndex]!;
      store.nextPage(nextPage);
      return;
    }

    // Demo mode: 5 curated pages; normal mode: 5 random pages
    const totalPages = store.demoMode ? 5 : 5;
    if (store.pagesCompleted >= totalPages - 1) {
      store.endGame();
      return;
    }

    const page = store.demoMode
      ? getDemoPage(store.pagesCompleted + 1)
      : getRandomCachedPage(usedIdsRef.current, store.currentLevel);
    usedIdsRef.current.push(page.id);
    store.nextPage(page);
  }, [store]);

  const handlePlayAgain = useCallback(() => {
    usedIdsRef.current = [];
    setTimeoutReveal(null);
    setPendingLevelId(null);
    setPendingDifficulty(1);
    store.resetGame();
  }, [store]);

  // ─── MENU STATE ───
  if (store.gamePhase === "menu") {
    return (
      <LevelSelector
        levelError={levelError}
        onSelectLevel={(levelId, difficulty) => {
          setLevelError(null);
          setPendingLevelId(levelId);
          setPendingDifficulty(difficulty);
        }}
        onQuickPlay={() => {
          setPendingLevelId(null);
          setPendingDifficulty(1);
          store.startGame(false);
        }}
        onDemoMode={() => {
          setPendingLevelId(null);
          setPendingDifficulty(1);
          store.startGame(true);
        }}
      />
    );
  }

  // ─── GAME OVER ───
  if (store.gamePhase === "gameover" && store.lastGameResult) {
    return (
      <GameOverScreen
        result={store.lastGameResult}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => (window.location.href = "/")}
        onViewLeaderboard={() => (window.location.href = "/leaderboard")}
      />
    );
  }

  // ─── LOADING ───
  if (store.gamePhase === "loading" || !store.currentPage) {
    return (
      <div className="flex min-h-svh items-center justify-center relative">
        <ParticleField particleCount={30} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="font-mono text-xs text-text-ghost uppercase tracking-widest mb-3">
            Locating archived page
          </div>
          <div className="flex items-center gap-2 justify-center">
            <motion.div
              className="h-1 w-8 bg-scan"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="h-1 w-8 bg-scan"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            />
            <motion.div
              className="h-1 w-8 bg-scan"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            />
          </div>
          <div className="mt-4 font-mono text-[10px] text-text-ghost/40">
            SECTOR {Math.floor(Math.random() * 9999)
              .toString()
              .padStart(4, "0")}{" "}
            · INTEGRITY DECLINING
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN GAMEPLAY ───
  const page = store.currentPage;
  const FakePageComponent = getFakePageComponent(page.contentType);
  const latestItems =
    store.selectedSections.length > 0
      ? store.archive.slice(-store.selectedSections.length)
      : [];
  const revealItems = timeoutReveal ? timeoutReveal.items : latestItems;
  const revealRoundScore = timeoutReveal
    ? timeoutReveal.roundScore
    : latestItems.reduce((sum, i) => sum + i.pointsEarned, 0);

  const isCritical = store.decayProgress >= 0.75;

  return (
    <motion.div
      className="flex min-h-svh flex-col relative"
      animate={
        screenShake
          ? {
            x: [0, -3, 3, -2, 2, 0],
            y: [0, 2, -2, 1, -1, 0],
          }
          : {}
      }
      transition={screenShake ? { duration: 0.4 } : {}}
    >
      {/* Background particles — subtle during gameplay */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParticleField particleCount={20} />
      </div>

      {/* Critical decay vignette */}
      {isCritical && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(255,51,68,0.15) 100%)",
          }}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-surface/40 px-4 py-2">
        <ScoreDisplay
          score={store.score}
          combo={store.combo}
          level={store.currentLevel}
        />
        <div className="flex-1 max-w-xs ml-6">
          <DecayTimer
            progress={store.decayProgress}
            remaining={decayEngine.remaining}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fake page viewport — 65-70% */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <FakePageComponent
                content={page}
                decayProgress={store.decayProgress}
                selectedSections={store.selectedSections}
                onSelectSection={
                  store.gamePhase === "playing" ? handleSectionSelect : undefined
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right panel — 30-35% */}
        <div className="w-[340px] shrink-0 border-l border-white/5 bg-surface/20 flex flex-col overflow-hidden">
          <div className="p-3 flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
            {/* Tools */}
            <ToolPanel
              factCheckData={page.factCheckData}
              decayProgress={store.decayProgress}
              className="flex-1 min-h-[420px]"
            />

            {/* Energy */}
            <div className="px-1 space-y-1.5">
              <EnergyBar
                current={store.archiveEnergy}
                max={store.maxArchiveEnergy}
              />
            </div>

            {/* Hint */}
            <div className="px-1 pb-1">
              <p className="font-sans text-sm leading-relaxed text-text-ghost">
                {store.selectedSections.length === 0
                  ? "Click sections in the page to mark them for archiving."
                  : `${store.selectedSections.length} section${store.selectedSections.length > 1 ? "s" : ""} selected. Use tools to verify before archiving.`}
              </p>
            </div>
          </div>

          {/* Archive button — pinned at bottom */}
          <div className="p-3 border-t border-white/5">
            <ArchiveButton
              selectedCount={store.selectedSections.length}
              disabled={
                store.selectedSections.length === 0 ||
                store.gamePhase !== "playing"
              }
              onArchive={handleArchive}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-white/5 bg-surface/40 px-4 py-1.5">
        <div className="font-mono text-xs text-text-ghost">
          Page {store.pagesCompleted + 1} of {store.levelPages.length > 0 ? store.levelPages.length : 5}
        </div>
        <div className="font-mono text-xs text-text-ghost">
          {store.demoMode && <span className="text-scan mr-2">DEMO</span>}
          {page.contentType.toUpperCase()} · Difficulty: {difficulty.label}
        </div>
      </div>

      {/* Reveal overlay */}
      <AnimatePresence>
        {store.gamePhase === "revealing" &&
          (timeoutReveal !== null || latestItems.length > 0) && (
            <RevealScreen
              items={revealItems}
              roundScore={revealRoundScore}
              combo={store.combo}
              onContinue={handleNextPage}
            />
          )}
      </AnimatePresence>
    </motion.div>
  );
}

function getFakePageComponent(contentType: PageContent["contentType"]) {
  switch (contentType) {
    case "news":
      return NewsArticle;
    case "blog":
      return BlogPost;
    case "social":
      return SocialThread;
    case "wiki":
      return WikiArticle;
    default:
      return NewsArticle;
  }
}
