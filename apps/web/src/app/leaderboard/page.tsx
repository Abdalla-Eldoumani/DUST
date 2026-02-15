"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";

// Fallback data for demo
const DEMO_LEADERBOARD = [
  { username: "ArchiveQueen", score: 4250, accuracy: 94, level: 8 },
  { username: "TruthSeeker42", score: 3800, accuracy: 88, level: 7 },
  { username: "DataDiver", score: 3450, accuracy: 91, level: 7 },
  { username: "FactHunter", score: 2900, accuracy: 82, level: 6 },
  { username: "CriticalMind", score: 2650, accuracy: 79, level: 6 },
  { username: "ArchivistPro", score: 2100, accuracy: 85, level: 5 },
  { username: "InfoGuard", score: 1850, accuracy: 76, level: 5 },
  { username: "PageSaver", score: 1600, accuracy: 72, level: 4 },
  { username: "DustCollector", score: 1200, accuracy: 68, level: 4 },
  { username: "NewArchiver", score: 800, accuracy: 65, level: 3 },
];

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  accuracy: number;
  level: number;
}

export default function LeaderboardPage() {
  const convexData = useQuery(api.leaderboard.getTop, { limit: 20 });

  // Use Convex data if available and non-empty, otherwise fallback
  const entries: LeaderboardEntry[] =
    convexData && convexData.length > 0
      ? convexData.map(
          (e: { username: string; score: number; accuracy: number; level: number }, i: number) => ({
            rank: i + 1,
            username: e.username,
            score: e.score,
            accuracy: e.accuracy,
            level: e.level,
          })
        )
      : DEMO_LEADERBOARD.map((e, i) => ({ rank: i + 1, ...e }));

  return (
    <div className="relative min-h-svh bg-void">
      <ScanlineOverlay />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber" />
            <GlowText
              as="h1"
              color="amber"
              intensity="medium"
              className="font-mono text-3xl font-bold uppercase tracking-wider"
            >
              Leaderboard
            </GlowText>
          </div>
          <p className="mt-2 font-sans text-sm text-text-secondary">
            Top archivists ranked by score
            {convexData && convexData.length > 0 && (
              <span className="ml-2 text-archive text-xs">LIVE</span>
            )}
          </p>
        </div>

        {/* Leaderboard table */}
        <TerminalPanel title="GLOBAL RANKINGS" glowColor="amber">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-ghost text-xs uppercase tracking-wider">
                  <th className="py-2 text-left w-12">#</th>
                  <th className="py-2 text-left">Player</th>
                  <th className="py-2 text-right">Score</th>
                  <th className="py-2 text-right">Accuracy</th>
                  <th className="py-2 text-right">Level</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <motion.tr
                    key={`${entry.username}-${entry.rank}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-b border-white/5 ${
                      entry.rank <= 3
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    <td className="py-2.5">
                      <span
                        className={
                          entry.rank === 1
                            ? "text-amber glow-amber"
                            : entry.rank === 2
                              ? "text-text-primary"
                              : entry.rank === 3
                                ? "text-amber/60"
                                : ""
                        }
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-2.5">{entry.username}</td>
                    <td className="py-2.5 text-right tabular-nums text-archive">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {entry.accuracy}%
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-scan">
                      {entry.level}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}
