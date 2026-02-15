"use client";

import { useMemo } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@DUST/backend/convex/_generated/api";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { FireBarrier } from "@/components/ui/fire-barrier";
import { UserRankCard, NoRankCard } from "@/components/leaderboard/user-rank-card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";

export default function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const fromPostGame = searchParams.get("from") === "postgame";
  const mode = searchParams.get("mode") === "coop" ? "coop" : "solo";
  const levelFromParams = Number(searchParams.get("level"));
  const level = Number.isInteger(levelFromParams) && levelFromParams > 0 ? levelFromParams : 1;

  const leaderboardQueryArgs = useMemo(
    () =>
      mode === "solo"
        ? { limit: 50, leaderboardType: "solo" as const, level }
        : { limit: 50, leaderboardType: "coop" as const },
    [mode, level]
  );
  const myRankQueryArgs = useMemo(
    () =>
      mode === "solo"
        ? { leaderboardType: "solo" as const, level }
        : { leaderboardType: "coop" as const },
    [mode, level]
  );

  const entries = useQuery(api.leaderboard.getTop, leaderboardQueryArgs);
  const myRank = useQuery(api.leaderboard.getMyRank, myRankQueryArgs);

  const setMode = (nextMode: "solo" | "coop") => {
    if (nextMode === "coop") {
      router.push("/leaderboard?mode=coop");
      return;
    }
    router.push(`/leaderboard?mode=solo&level=${level}`);
  };

  const setLevel = (nextLevel: number) => {
    router.push(`/leaderboard?mode=solo&level=${nextLevel}`);
  };

  return (
    <div className="relative min-h-svh bg-void">
      <FireBarrier />
      <ScanlineOverlay />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => {
              if (fromPostGame) {
                router.push("/play");
                return;
              }
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
            {mode === "coop" ? "Top co-op teams ranked by score" : `Top solo archivists for level ${level}`}
            {entries && entries.length > 0 && (
              <span className="ml-2 text-archive text-xs">LIVE</span>
            )}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("solo")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors ${
              mode === "solo"
                ? "border-archive/40 text-archive bg-archive/10"
                : "border-white/10 text-text-ghost hover:text-text-secondary"
            }`}
          >
            Solo
          </button>
          <button
            type="button"
            onClick={() => setMode("coop")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors ${
              mode === "coop"
                ? "border-archive/40 text-archive bg-archive/10"
                : "border-white/10 text-text-ghost hover:text-text-secondary"
            }`}
          >
            Co-op
          </button>
        </div>

        {mode === "solo" && (
          <div className="mb-6 flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => {
              const current = i + 1;
              return (
                <button
                  key={current}
                  type="button"
                  onClick={() => setLevel(current)}
                  className={`px-2.5 py-1 font-mono text-xs border transition-colors ${
                    level === current
                      ? "border-scan/50 text-scan bg-scan/10"
                      : "border-white/10 text-text-ghost hover:text-text-secondary"
                  }`}
                >
                  L{current}
                </button>
              );
            })}
          </div>
        )}

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
        <TerminalPanel title={mode === "coop" ? "CO-OP RANKINGS" : `SOLO LEVEL ${level} RANKINGS`} glowColor="amber">
          <LeaderboardTable
            entries={entries}
            currentClerkId={user?.id}
          />
        </TerminalPanel>
      </div>
    </div>
  );
}
