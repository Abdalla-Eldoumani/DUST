"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { LeaderboardEntry } from "./leaderboard-entry";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardRow {
  _id: string;
  clerkId: string;
  username: string;
  avatarUrl: string;
  score: number;
  accuracy: number;
  level: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardRow[] | undefined;
  currentClerkId?: string;
}

export function LeaderboardTable({ entries, currentClerkId }: LeaderboardTableProps) {
  // Loading state
  if (entries === undefined) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full bg-elevated/50" />
        ))}
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <Trophy className="mb-3 h-8 w-8 text-text-ghost" />
        <p className="font-sans text-sm text-text-secondary">
          No scores yet. Be the first archivist on the board!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-white/10 text-text-ghost text-xs uppercase tracking-wider">
            <th className="py-2 text-left pl-2 w-12">#</th>
            <th className="py-2 text-left">Player</th>
            <th className="py-2 text-right">Score</th>
            <th className="py-2 text-right">Accuracy</th>
            <th className="py-2 text-right pr-2">Level</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <LeaderboardEntry
              key={entry._id}
              rank={i + 1}
              username={entry.username}
              avatarUrl={entry.avatarUrl}
              score={entry.score}
              accuracy={entry.accuracy}
              level={entry.level}
              isCurrentUser={entry.clerkId === currentClerkId}
              index={i}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
