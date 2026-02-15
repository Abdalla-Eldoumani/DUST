"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";

interface MatchResultsProps {
  roomId: Id<"multiplayerRooms">;
  mode: "race" | "coop";
  hostUsername: string;
  guestUsername: string;
  hostAvatarUrl: string;
  guestAvatarUrl: string;
  hostScore: number;
  guestScore: number;
  sharedScore?: number;
  maxRounds: number;
  isHost: boolean;
}

export function MatchResults({
  roomId,
  mode,
  hostUsername,
  guestUsername,
  hostAvatarUrl,
  guestAvatarUrl,
  hostScore,
  guestScore,
  sharedScore,
  maxRounds,
  isHost,
}: MatchResultsProps) {
  const router = useRouter();
  const submitScore = useMutation(api.leaderboard.submit);
  const [submitted, setSubmitted] = useState(false);

  // Auto-submit score to leaderboard
  useEffect(() => {
    if (submitted) return;
    setSubmitted(true);

    const score =
      mode === "coop"
        ? sharedScore ?? 0
        : isHost
          ? hostScore
          : guestScore;

    if (score > 0) {
      submitScore({
        score,
        accuracy: 75, // approximate for multiplayer
        level: maxRounds,
        pagesCompleted: maxRounds,
      })
        .then(() => toast.success("Score saved to leaderboard!"))
        .catch(() => { /* silent */ });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const winner =
    mode === "coop"
      ? null
      : hostScore > guestScore
        ? hostUsername
        : guestScore > hostScore
          ? guestUsername
          : null;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <TerminalPanel title="MATCH COMPLETE" glowColor={mode === "race" ? "amber" : "green"}>
        <div className="p-8 space-y-8 text-center">
          {mode === "race" ? (
            <>
              {/* Winner announcement */}
              <div>
                <Trophy className="mx-auto mb-3 h-10 w-10 text-amber" />
                {winner ? (
                  <GlowText as="h2" color="amber" intensity="high" className="font-mono text-2xl font-bold uppercase">
                    {winner} Wins!
                  </GlowText>
                ) : (
                  <GlowText as="h2" color="amber" intensity="high" className="font-mono text-2xl font-bold uppercase">
                    It&apos;s a Tie!
                  </GlowText>
                )}
              </div>

              {/* Score comparison */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <img src={hostAvatarUrl} alt="" className="mx-auto mb-2 h-12 w-12 rounded-full" />
                  <p className="font-mono text-xs text-text-ghost mb-1">{hostUsername}</p>
                  <GlowText
                    as="p"
                    color={hostScore >= guestScore ? "green" : "amber"}
                    intensity="medium"
                    className="font-mono text-3xl font-bold"
                  >
                    {hostScore}
                  </GlowText>
                </div>
                <span className="font-mono text-lg text-text-ghost">vs</span>
                <div className="text-center">
                  <img src={guestAvatarUrl} alt="" className="mx-auto mb-2 h-12 w-12 rounded-full" />
                  <p className="font-mono text-xs text-text-ghost mb-1">{guestUsername}</p>
                  <GlowText
                    as="p"
                    color={guestScore >= hostScore ? "green" : "amber"}
                    intensity="medium"
                    className="font-mono text-3xl font-bold"
                  >
                    {guestScore}
                  </GlowText>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Co-op result */}
              <div>
                <Trophy className="mx-auto mb-3 h-10 w-10 text-archive" />
                <GlowText as="h2" color="green" intensity="high" className="font-mono text-2xl font-bold uppercase">
                  Archive Complete
                </GlowText>
              </div>

              <div className="flex items-center justify-center gap-4">
                <img src={hostAvatarUrl} alt="" className="h-10 w-10 rounded-full" />
                <span className="font-mono text-text-ghost">&</span>
                <img src={guestAvatarUrl} alt="" className="h-10 w-10 rounded-full" />
              </div>

              <GlowText as="p" color="green" intensity="high" className="font-mono text-4xl font-bold">
                {sharedScore ?? 0}
              </GlowText>
              <p className="font-mono text-sm text-text-secondary">
                Combined score over {maxRounds} rounds
              </p>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/multiplayer")}
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Rematch
            </button>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Home className="h-4 w-4" />
              Menu
            </button>
          </div>
        </div>
      </TerminalPanel>
    </div>
  );
}
