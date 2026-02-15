"use client";

import { motion } from "framer-motion";
import { Clock, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { GlowText } from "@/components/ui/glow-text";
import { ParticleField } from "@/components/ui/particle-field";
import { getDifficulty } from "@/lib/content/difficulty";

const PROJECT_ID = "calgaryhacks2026";

interface LevelSelectorProps {
  onSelectLevel: (levelId: string, difficulty: number) => void;
  onQuickPlay: () => void;
  onDemoMode: () => void;
}

function getDifficultyColor(difficulty: number) {
  if (difficulty <= 3)
    return {
      text: "text-archive",
      border: "border-archive/30",
      bg: "bg-archive/5",
      glow: "hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]",
    };
  if (difficulty <= 6)
    return {
      text: "text-amber",
      border: "border-amber/30",
      bg: "bg-amber/5",
      glow: "hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]",
    };
  return {
    text: "text-decay",
    border: "border-decay/30",
    bg: "bg-decay/5",
    glow: "hover:shadow-[0_0_20px_rgba(255,51,68,0.15)]",
  };
}

function getDifficultyLabel(d: number) {
  if (d <= 3) return "EASY";
  if (d <= 6) return "MEDIUM";
  return "HARD";
}

export function LevelSelector({
  onSelectLevel,
  onQuickPlay,
  onDemoMode,
}: LevelSelectorProps) {
  const levels = useQuery(api.levels.getByProject, { projectId: PROJECT_ID });
  const isLoading = levels === undefined;
  const sortedLevels = levels
    ? [...levels].sort((a, b) => a.difficulty - b.difficulty)
    : [];

  return (
    <div className="flex min-h-svh flex-col items-center justify-center relative">
      <ParticleField particleCount={40} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-10 text-center md:mb-12">
          <GlowText
            as="h1"
            color="green"
            intensity="high"
            className="font-mono text-5xl font-bold tracking-[0.12em] md:text-7xl"
          >
            SELECT LEVEL
          </GlowText>
          <p className="mt-3 font-serif text-base text-text-secondary md:text-xl">
            Choose a difficulty level. Higher levels have faster decay and
            subtler misinformation.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-6 w-6 text-scan animate-spin" />
            <span className="font-mono text-xs text-text-ghost uppercase tracking-wider">
              Loading levels from archive...
            </span>
          </div>
        )}

        {/* No levels found — fallback */}
        {levels && levels.length === 0 && (
          <div className="mb-8 py-10 text-center">
            <p className="mb-6 font-mono text-2xl text-text-ghost/80">
              No levels found in database. Using cached content.
            </p>
            <button
              onClick={onQuickPlay}
              className="min-w-[220px] px-10 py-4 font-mono text-lg uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
            >
              Quick Play
            </button>
          </div>
        )}

        {/* Level grid */}
        {sortedLevels.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {sortedLevels.map((level, i) => {
              const colors = getDifficultyColor(level.difficulty);
              const diffConfig = getDifficulty(level.difficulty);
              const label = getDifficultyLabel(level.difficulty);
              const pageCount = level.pageIds.length;

              return (
                <motion.button
                  key={level.levelId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() =>
                    onSelectLevel(level.levelId, level.difficulty)
                  }
                  className={`relative p-4 border ${colors.border} ${colors.bg} ${colors.glow} transition-all duration-200 group text-left`}
                >
                  <div
                    className={`font-mono text-2xl font-bold ${colors.text} mb-1`}
                  >
                    {level.difficulty}
                  </div>
                  <div
                    className={`font-mono text-[10px] uppercase tracking-wider ${colors.text} opacity-70 mb-3`}
                  >
                    {label}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-text-ghost" />
                      <span className="font-mono text-[10px] text-text-ghost">
                        {diffConfig.decayDuration}s
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-text-ghost" />
                      <span className="font-mono text-[10px] text-text-ghost">
                        {pageCount} page{pageCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-6">
          {sortedLevels.length > 0 && (
            <button
              onClick={onQuickPlay}
              className="min-w-[260px] px-10 py-4 font-mono text-lg uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
            >
              Quick Play (Random)
            </button>
          )}
          <button
            onClick={onDemoMode}
            className="min-w-[220px] px-10 py-4 font-mono text-lg uppercase tracking-wider bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 transition-colors"
          >
            Demo Mode
          </button>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 text-base text-text-ghost hover:text-text-secondary transition-colors font-sans md:text-xl"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
