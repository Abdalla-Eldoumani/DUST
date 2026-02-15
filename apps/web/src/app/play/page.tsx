"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { useDecayEngine } from "@/lib/decay/decay-engine";
import { getRandomCachedPage } from "@/lib/content/content-cache";
import { getDemoPage } from "@/lib/content/demo-content";
import { getDifficulty } from "@/lib/content/difficulty";

import { NewsArticle } from "@/components/game/fake-page/news-article";
import { BlogPost } from "@/components/game/fake-page/blog-post";
import { SocialThread } from "@/components/game/fake-page/social-thread";
import { WikiArticle } from "@/components/game/fake-page/wiki-article";

import { DecayTimer } from "@/components/game/decay-timer";
import { ToolPanel } from "@/components/game/tools/tool-panel";
import { EnergyBar } from "@/components/game/archive/energy-bar";
import { ArchiveButton } from "@/components/game/archive/archive-button";
import { ScoreDisplay } from "@/components/game/scoring/score-display";
import { RevealScreen } from "@/components/game/scoring/reveal-screen";
import { GameOverScreen } from "@/components/game/scoring/game-over-screen";
import { GlitchText } from "@/components/ui/glitch-text";
import { ParticleField } from "@/components/ui/particle-field";

import type { PageContent } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();
  const usedIdsRef = useRef<string[]>([]);
  const [screenShake, setScreenShake] = useState(false);

  const difficulty = useMemo(
    () => getDifficulty(store.currentLevel),
    [store.currentLevel]
  );

  const decayEngine = useDecayEngine({
    duration: store.currentPage?.decayDuration ?? difficulty.decayDuration,
    onProgress: store.setDecayProgress,
  });

  // Load first page when game starts
  useEffect(() => {
    if (store.gamePhase === "loading") {
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

  // Auto-archive (or force end) when decay completes
  useEffect(() => {
    if (decayEngine.isComplete && store.gamePhase === "playing") {
      if (store.selectedSections.length > 0) {
        handleArchive();
      } else {
        // No sections selected — skip to next page or end game
        handleNextPage();
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
    store.archiveSelected();
  }, [decayEngine, store]);

  const handleNextPage = useCallback(() => {
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
    store.startGame();
  }, [store]);

  const handleViewLeaderboard = useCallback(() => {
    router.push("/leaderboard");
  }, [router]);

  // ─── MENU STATE ───
  if (store.gamePhase === "menu") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center relative">
        <ParticleField particleCount={40} />
        <div className="relative z-10 text-center px-4">
          <GlitchText
            text="SOLO PLAYER"
            intensity="low"
            interval={6000}
            className="font-mono text-4xl font-bold tracking-wider text-scan"
          />
          <p className="font-serif text-text-secondary mb-8 max-w-sm mx-auto">
            Analyze web pages for misinformation. Archive the truth before it
            decays.
          </p>

          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => store.startGame(false)}
              className="px-8 py-3 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
            >
              Start Game
            </button>
            <button
              onClick={() => store.startGame(true)}
              className="px-8 py-3 font-mono text-sm uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
            >
              Demo Mode
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 mt-4 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── GAME OVER ───
  if (store.gamePhase === "gameover" && store.lastGameResult) {
    return (
      <GameOverScreen
        result={store.lastGameResult}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => (window.location.href = "/")}
        onViewLeaderboard={handleViewLeaderboard}
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
  const latestItems = store.archive.slice(-store.selectedSections.length);

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
          Page {store.pagesCompleted + 1} of 5
        </div>
        <div className="font-mono text-xs text-text-ghost">
          {store.demoMode && <span className="text-scan mr-2">DEMO</span>}
          {page.contentType.toUpperCase()} · Difficulty: {difficulty.label}
        </div>
      </div>

      {/* Reveal overlay */}
      <AnimatePresence>
        {store.gamePhase === "revealing" && latestItems.length > 0 && (
          <RevealScreen
            items={latestItems}
            roundScore={latestItems.reduce((sum, i) => sum + i.pointsEarned, 0)}
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
