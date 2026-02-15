"use client";

import { ArrowLeft, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@DUST/backend/convex/_generated/api";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { UserRankCard, NoRankCard } from "@/components/leaderboard/user-rank-card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";

export default function LeaderboardPage() {
  const router = useRouter();
  const entries = useQuery(api.leaderboard.getTop, { limit: 50 });
  const myRank = useQuery(api.leaderboard.getMyRank);
  const { user } = useUser();

  return (
    <div className="relative min-h-svh bg-void">
      <ScanlineOverlay />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

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
            {entries && entries.length > 0 && (
              <span className="ml-2 text-archive text-xs">LIVE</span>
            )}
          </p>
        </div>

        {/* User rank card */}
        {myRank ? (
          <UserRankCard
            rank={myRank.rank}
            username={myRank.entry.username}
            avatarUrl={myRank.entry.avatarUrl}
            score={myRank.entry.score}
            accuracy={myRank.entry.accuracy}
          />
        ) : myRank === null ? (
          <NoRankCard />
        ) : null}

        {/* Leaderboard table */}
        <TerminalPanel title="GLOBAL RANKINGS" glowColor="amber">
          <LeaderboardTable
            entries={entries}
            currentClerkId={user?.id}
          />
        </TerminalPanel>
      </div>
    </div>
  );
}
