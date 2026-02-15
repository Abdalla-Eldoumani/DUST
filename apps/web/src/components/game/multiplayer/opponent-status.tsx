"use client";

import { motion } from "framer-motion";
import { Check, Search } from "lucide-react";
import type { PlayerInfo } from "@/app/multiplayer/[code]/page";

interface OpponentStatusProps {
  otherPlayers: PlayerInfo[];
  archivedPlayerIds: string[];
  mode: "race" | "coop";
}

export function OpponentStatus({
  otherPlayers,
  archivedPlayerIds,
  mode,
}: OpponentStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 px-3 py-2 border flex-wrap ${
        mode === "race"
          ? "border-decay/20 bg-decay/5"
          : "border-archive/20 bg-archive/5"
      }`}
    >
      {otherPlayers.map((player) => {
        const hasArchived = archivedPlayerIds.includes(player.clerkId);
        return (
          <div key={player.clerkId} className="flex items-center gap-2">
            <img src={player.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
            <span className="font-mono text-xs text-text-secondary">{player.username}</span>
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
          </div>
        );
      })}
    </motion.div>
  );
}
