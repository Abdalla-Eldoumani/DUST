"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecayTimerProps {
  progress: number; // 0.0 to 1.0
  remaining: number; // seconds remaining
}

export function DecayTimer({ progress, remaining }: DecayTimerProps) {
  const remaining100 = 1 - progress;
  const isUrgent = remaining100 < 0.25;
  const isCritical = remaining100 < 0.1;

  // Color transitions: green → amber → red
  const barColor =
    remaining100 > 0.5
      ? "bg-archive"
      : remaining100 > 0.25
        ? "bg-amber"
        : "bg-decay";

  const glowClass =
    remaining100 > 0.5
      ? ""
      : remaining100 > 0.25
        ? "shadow-[0_0_10px_rgba(255,170,0,0.4)]"
        : "shadow-[0_0_15px_rgba(255,51,68,0.5)]";

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
        Decay
      </span>

      {/* Timer bar container */}
      <div className="relative h-2 flex-1 overflow-hidden bg-elevated/60 border border-white/5">
        <motion.div
          className={cn("h-full origin-left", barColor, glowClass)}
          style={{ width: `${remaining100 * 100}%` }}
          animate={
            isUrgent
              ? {
                  opacity: isCritical ? [1, 0.5, 1] : [1, 0.7, 1],
                }
              : {}
          }
          transition={
            isUrgent
              ? {
                  repeat: Infinity,
                  duration: isCritical ? 0.3 : 0.8,
                }
              : {}
          }
        />
      </div>

      {/* Time remaining */}
      <span
        className={cn(
          "font-mono text-sm tabular-nums min-w-[3ch]",
          remaining100 > 0.5
            ? "text-archive"
            : remaining100 > 0.25
              ? "text-amber"
              : "text-decay"
        )}
      >
        {Math.ceil(remaining)}s
      </span>
    </div>
  );
}
