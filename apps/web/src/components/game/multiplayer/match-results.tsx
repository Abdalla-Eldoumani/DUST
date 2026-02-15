"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Circle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";

interface MatchResultsProps {
  roomId: Id<"multiplayerRooms">;
  mode: "race" | "coop";
  currentRound: number;
  hostUsername: string;
  guestUsername: string;
  hostAvatarUrl: string;
  guestAvatarUrl: string;
  hostScore: number;
  guestScore: number;
  sharedScore?: number;
  maxRounds: number;
  isHost: boolean;
  hostPresent?: boolean;
  guestPresent?: boolean;
  opponentPresent: boolean;
}

export function MatchResults({
  roomId,
  mode,
  currentRound,
  hostUsername,
  guestUsername,
  hostAvatarUrl,
  guestAvatarUrl,
  hostScore,
  guestScore,
  sharedScore,
  maxRounds,
  isHost,
  hostPresent,
  guestPresent,
  opponentPresent,
}: MatchResultsProps) {
  const submitScore = useMutation(api.leaderboard.submit);
  const setPresence = useMutation(api.multiplayer.setPresence);
  const rematchMutation = useMutation(api.multiplayer.rematch);
  const [submitted, setSubmitted] = useState(false);
  const [rematchLoading, setRematchLoading] = useState(false);

  const opponentName = isHost ? guestUsername : hostUsername;
  const matchEndedEarly = currentRound < maxRounds;
  const hasDisconnectOutcome =
    mode === "race" &&
    matchEndedEarly &&
    (hostPresent === false || guestPresent === false);
  const selfPresentAtFinish = isHost ? hostPresent !== false : guestPresent !== false;
  const opponentPresentAtFinish = isHost ? guestPresent !== false : hostPresent !== false;
  const youWonByDefault = hasDisconnectOutcome && selfPresentAtFinish && !opponentPresentAtFinish;
  const youLostByDefault = hasDisconnectOutcome && !selfPresentAtFinish && opponentPresentAtFinish;

  // Mark self as present on mount, absent on leave
  const markAbsent = useCallback(() => {
    setPresence({ roomId, present: false }).catch(() => { });
  }, [roomId, setPresence]);

  useEffect(() => {
    setPresence({ roomId, present: true }).catch(() => { });

    // Handle tab close / navigation
    window.addEventListener("beforeunload", markAbsent);
    return () => {
      window.removeEventListener("beforeunload", markAbsent);
      markAbsent();
    };
  }, [roomId, setPresence, markAbsent]);

  // Auto-submit score to leaderboard
  useEffect(() => {
    if (submitted) return;
    if (hasDisconnectOutcome) return;
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
  }, [hasDisconnectOutcome, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const winner =
    mode === "coop"
      ? null
      : hostScore > guestScore
        ? hostUsername
        : guestScore > hostScore
          ? guestUsername
          : null;

  const handleLeave = (path: string) => {
    markAbsent();
    window.location.href = path;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <TerminalPanel title="MATCH COMPLETE" glowColor={mode === "race" ? "amber" : "green"}>
        <div className="p-8 space-y-8 text-center">
          {hasDisconnectOutcome ? (
            <div>
              <Trophy className="mx-auto mb-3 h-10 w-10 text-amber" />
              <GlowText as="h2" color="amber" intensity="high" className="font-mono text-2xl font-bold uppercase">
                {youWonByDefault ? "You Win by Default" : youLostByDefault ? "You Lost by Default" : "Match Ended"}
              </GlowText>
              <p className="mt-2 font-sans text-sm text-text-secondary">
                {youWonByDefault
                  ? "Everyone else left. You win this match."
                  : youLostByDefault
                    ? "You left during the match. Opponent wins by default."
                    : "The match ended early because players left."}
              </p>
            </div>
          ) : mode === "race" ? (
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

          {/* Opponent presence indicator */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${opponentPresent
                ? "border-archive/30 bg-archive/5"
                : "border-white/10 bg-white/5"
              }`}
          >
            <Circle
              className={`h-2.5 w-2.5 ${opponentPresent
                  ? "text-archive fill-archive"
                  : "text-text-ghost fill-text-ghost"
                }`}
            />
            <span className={`font-mono text-xs ${opponentPresent ? "text-archive" : "text-text-ghost"
              }`}>
              {opponentPresent
                ? `${opponentName} is still here`
                : `${opponentName} has left`}
            </span>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                if (rematchLoading) return;
                setRematchLoading(true);
                try {
                  const result = await rematchMutation({ roomId });
                  window.location.href = `/multiplayer/${result.roomCode}`;
                } catch {
                  toast.error("Failed to create rematch");
                  setRematchLoading(false);
                }
              }}
              disabled={rematchLoading}
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${rematchLoading ? "animate-spin" : ""}`} />
              {rematchLoading ? "Creating..." : "Rematch"}
            </button>
            <button
              onClick={() => handleLeave("/")}
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
