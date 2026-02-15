"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Link from "next/link";

interface UserRankCardProps {
  rank: number;
  username: string;
  avatarUrl: string;
  score: number;
  accuracy: number;
}

export function UserRankCard({
  rank,
  username,
  avatarUrl,
  score,
  accuracy,
}: UserRankCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 border border-archive/30 bg-archive/5 p-4"
      style={{ boxShadow: "0 0 20px rgba(0,255,136,0.1)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 border border-archive/40 font-mono text-lg font-bold text-archive">
          #{rank}
        </div>
        <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <div className="font-mono text-sm text-text-primary">{username}</div>
          <div className="font-mono text-xs text-text-ghost">Your best score</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-archive">
            {score.toLocaleString()}
          </div>
          <div className="font-mono text-xs text-text-ghost">{accuracy}% accuracy</div>
        </div>
      </div>
    </motion.div>
  );
}

export function NoRankCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 border border-white/10 bg-elevated/30 p-4 text-center"
    >
      <Trophy className="mx-auto mb-2 h-5 w-5 text-text-ghost" />
      <p className="font-sans text-sm text-text-secondary mb-2">
        No score yet — play to get on the board!
      </p>
      <Link
        href="/play"
        className="inline-block px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-archive border border-archive/30 hover:bg-archive/10 transition-colors"
      >
        Play Now
      </Link>
    </motion.div>
  );
}
