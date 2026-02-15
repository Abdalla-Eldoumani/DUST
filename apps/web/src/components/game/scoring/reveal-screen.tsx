"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import type { ArchivedItem } from "@/lib/types";

interface RevealScreenProps {
  items: ArchivedItem[];
  roundScore: number;
  combo: number;
  onContinue: () => void;
}

export function RevealScreen({
  items,
  roundScore,
  combo,
  onContinue,
}: RevealScreenProps) {
  const correctCount = items.filter((i) => i.wasCorrect).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md mx-4 border border-white/10 bg-surface p-6"
      >
        <h2 className="font-mono text-lg text-text-primary mb-4 text-center uppercase tracking-wider">
          Archive Analysis
        </h2>

        {/* Results list */}
        <div className="space-y-2 mb-6">
          {items.map((item, i) => (
            <motion.div
              key={item.sectionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`flex items-start gap-2 p-2 border ${
                item.wasCorrect
                  ? "border-archive/20 bg-archive/5"
                  : "border-decay/20 bg-decay/5"
              }`}
            >
              {item.wasCorrect ? (
                <CheckCircle className="h-4 w-4 text-archive shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-decay shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-secondary font-serif line-clamp-2">
                  {item.sectionText}
                </p>
                <span
                  className={`font-mono text-xs ${item.wasCorrect ? "text-archive" : "text-decay"}`}
                >
                  {item.wasCorrect ? `+${item.pointsEarned}` : item.pointsEarned}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Score summary */}
        <div className="border-t border-white/5 pt-4 mb-4 space-y-1 text-center">
          <div className="font-mono text-sm text-text-secondary">
            {correctCount}/{items.length} correct
          </div>
          <div
            className={`font-mono text-2xl font-bold ${roundScore >= 0 ? "text-archive glow-green" : "text-decay glow-red"}`}
          >
            {roundScore >= 0 ? "+" : ""}
            {roundScore}
          </div>
          {combo > 1 && (
            <div className="font-mono text-xs text-amber">
              x{combo} combo multiplier active
            </div>
          )}
        </div>

        <button
          onClick={onContinue}
          className="w-full py-2 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
