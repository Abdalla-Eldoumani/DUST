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
  levelError?: string | null;
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
  levelError,
}: LevelSelectorProps) {
  const levels = useQuery(api.levels.getByProject, { projectId: PROJECT_ID });
  const variantCounts = useQuery(api.pageVariants.countValidByProject, { projectId: PROJECT_ID });
  const isLoading = levels === undefined || variantCounts === undefined;
  // Only show levels that have at least one valid variant in pageVariants
  const sortedLevels = levels && variantCounts
    ? [...levels]
        .filter((l) => (variantCounts[l.levelId] ?? 0) > 0)
        .sort((a, b) => a.difficulty - b.difficulty)
    : [];

  return (
    <div className="flex min-h-svh flex-col items-center justify-center relative">
      <ParticleField particleCount={40} />

      <div className="relative z-10 w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <GlowText
            as="h1"
            color="green"
            intensity="high"
            className="font-mono text-4xl font-bold mb-2"
          >
            SELECT LEVEL
          </GlowText>
          <p className="font-serif text-text-secondary text-sm">
            Choose a difficulty level. Higher levels have faster decay and
            subtler misinformation.
          </p>
        </div>

        {/* Level error banner */}
        {levelError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 border border-decay/30 bg-decay/10 px-4 py-3 font-mono text-xs text-decay"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {levelError}
          </motion.div>
        )}

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
          <div className="text-center py-8 mb-6">
            <p className="font-mono text-sm text-text-ghost mb-4">
              No levels found in database. Using cached content.
            </p>
            <button
              onClick={onQuickPlay}
              className="px-8 py-3 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
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
              const pageCount = variantCounts?.[level.levelId] ?? 0;

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
        <div className="flex flex-col items-center gap-3">
          {sortedLevels.length > 0 && (
            <button
              onClick={onQuickPlay}
              className="px-6 py-2 font-mono text-xs uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
            >
              Quick Play (Random)
            </button>
          )}
          <button
            onClick={onDemoMode}
            className="px-6 py-2 font-mono text-xs uppercase tracking-wider bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 transition-colors"
          >
            Demo Mode
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 mt-2 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

