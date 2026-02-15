"use client";

import { motion } from "framer-motion";

interface LeaderboardEntryProps {
  rank: number;
  username: string;
  avatarUrl: string;
  score: number;
  accuracy: number;
  level: number;
  isCurrentUser: boolean;
  index: number;
}

export function LeaderboardEntry({
  rank,
  username,
  avatarUrl,
  score,
  accuracy,
  level,
  isCurrentUser,
  index,
}: LeaderboardEntryProps) {
  const rankGlow =
    rank === 1
      ? "text-amber glow-amber"
      : rank === 2
        ? "text-text-primary"
        : rank === 3
          ? "text-amber/60"
          : "";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`border-b border-white/5 ${
        rank <= 3 ? "text-text-primary" : "text-text-secondary"
      } ${isCurrentUser ? "border-l-2 border-l-archive bg-archive/5" : ""}`}
    >
      <td className="py-2.5 pl-2 w-12">
        <span className={rankGlow}>{rank}</span>
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-2">
          <img src={avatarUrl} alt="" className="h-5 w-5 rounded-full" />
          <span>{username}</span>
        </div>
      </td>
      <td className="py-2.5 text-right tabular-nums text-archive">
        {score.toLocaleString()}
      </td>
      <td className="py-2.5 text-right tabular-nums">{accuracy}%</td>
      <td className="py-2.5 text-right tabular-nums text-scan pr-2">{level}</td>
    </motion.tr>
  );
}
