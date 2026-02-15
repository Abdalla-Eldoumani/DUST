"use client";

import { motion } from "framer-motion";
import { Check, Search } from "lucide-react";

interface OpponentStatusProps {
  name: string;
  avatarUrl: string;
  hasArchived: boolean;
  roundScore?: number;
  mode: "race" | "coop";
}

export function OpponentStatus({
  name,
  avatarUrl,
  hasArchived,
  roundScore,
  mode,
}: OpponentStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-3 py-2 border ${
        mode === "race"
          ? "border-decay/20 bg-decay/5"
          : "border-archive/20 bg-archive/5"
      }`}
    >
      <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full" />
      <span className="font-mono text-xs text-text-secondary">{name}</span>

      <div className="ml-auto flex items-center gap-2">
        {hasArchived ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-archive">
            <Check className="h-3 w-3" />
            Archived
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-text-ghost animate-pulse">
            <Search className="h-3 w-3" />
            Analyzing...
          </span>
        )}
        {roundScore !== undefined && roundScore > 0 && (
          <span className="font-mono text-xs text-amber tabular-nums">
            +{roundScore}
          </span>
        )}
      </div>
    </motion.div>
  );
}
