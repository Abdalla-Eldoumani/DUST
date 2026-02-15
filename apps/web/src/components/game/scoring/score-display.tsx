"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ScoreDisplayProps {
  score: number;
  combo: number;
  level: number;
}

export function ScoreDisplay({ score, combo, level }: ScoreDisplayProps) {
  const springScore = useSpring(0, { stiffness: 100, damping: 20 });
  const displayScore = useTransform(springScore, (v) =>
    Math.round(v).toLocaleString()
  );

  useEffect(() => {
    springScore.set(score);
  }, [score, springScore]);

  return (
    <div className="flex items-center gap-6 font-mono text-sm">
      {/* Score */}
      <div className="flex items-center gap-2">
        <span className="text-text-ghost text-xs uppercase tracking-wider">
          Score
        </span>
        <motion.span className="text-text-primary tabular-nums font-bold">
          {displayScore}
        </motion.span>
      </div>

      {/* Level */}
      <div className="flex items-center gap-2">
        <span className="text-text-ghost text-xs uppercase tracking-wider">
          Level
        </span>
        <span className="text-scan tabular-nums font-bold">{level}</span>
      </div>

      {/* Combo */}
      {combo > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 border",
            combo >= 5
              ? "text-archive border-archive/30 bg-archive/10"
              : combo >= 3
                ? "text-amber border-amber/30 bg-amber/10"
                : "text-text-secondary border-white/10 bg-white/5"
          )}
        >
          <span className="text-xs">{combo}</span>
          <span className="text-xs">STREAK</span>
        </motion.div>
      )}
    </div>
  );
}
