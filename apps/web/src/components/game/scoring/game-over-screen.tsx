"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Target, Layers, Zap, Clock, Check, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { GameResult } from "@/lib/types";
import { GlowText } from "@/components/ui/glow-text";

interface GameOverScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export function GameOverScreen({
  result,
  onPlayAgain,
  onViewLeaderboard,
}: GameOverScreenProps) {
  const submitScore = useMutation(api.leaderboard.submit);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "saved" | "error">("idle");

  useEffect(() => {
    if (submitState !== "idle") return;
    setSubmitState("submitting");
    submitScore({
      score: result.totalScore,
      accuracy: result.accuracy,
      level: result.level,
      pagesCompleted: result.pagesCompleted,
    })
      .then(() => {
        setSubmitState("saved");
        toast.success("Score saved to leaderboard!");
      })
      .catch(() => {
        setSubmitState("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = [
    {
      icon: Trophy,
      label: "Final Score",
      value: result.totalScore.toLocaleString(),
      color: "text-archive",
    },
    {
      icon: Target,
      label: "Accuracy",
      value: `${result.accuracy}%`,
      color: result.accuracy >= 70 ? "text-archive" : "text-amber",
    },
    {
      icon: Layers,
      label: "Pages Archived",
      value: `${result.pagesCompleted}`,
      color: "text-scan",
    },
    {
      icon: Zap,
      label: "Best Combo",
      value: `x${result.bestCombo}`,
      color: "text-amber",
    },
    {
      icon: Clock,
      label: "Time Played",
      value: formatTime(result.timePlayed),
      color: "text-text-secondary",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-lg mx-4 border border-white/10 bg-surface p-8"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <GlowText
            as="h1"
            color="green"
            intensity="high"
            className="font-mono text-3xl font-bold uppercase tracking-widest mb-2"
          >
            Archive Complete
          </GlowText>
          <p className="font-sans text-sm text-text-secondary">
            Your contribution to the archive has been recorded.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`p-3 border border-white/5 bg-elevated/30 ${i === 0 ? "col-span-2" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="font-mono text-xs text-text-ghost uppercase">
                  {label}
                </span>
              </div>
              <span
                className={`font-mono text-xl font-bold ${color} ${i === 0 ? "text-3xl" : ""}`}
              >
                {value}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Score submission status */}
        <div className="mb-6 text-center">
          {submitState === "submitting" && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-ghost">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving score...
            </span>
          )}
          {submitState === "saved" && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-archive">
              <Check className="h-3 w-3" />
              Score saved!
            </span>
          )}
          {submitState === "error" && (
            <button
              onClick={() => {
                setSubmitState("idle");
              }}
              className="font-mono text-xs text-amber hover:text-amber/80 transition-colors"
            >
              Failed to save — tap to retry
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onViewLeaderboard}
            className="flex-1 py-3 font-mono text-sm uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
          >
            Leaderboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
