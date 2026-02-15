"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Circle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import type { PlayerInfo } from "@/app/multiplayer/[code]/page";

interface MatchResultsProps {
  roomId: Id<"multiplayerRooms">;
  mode: "race" | "coop";
  currentRound: number;
  maxRounds: number;
  isHost: boolean;
  players: PlayerInfo[];
  myClerkId: string;
  sharedScore?: number;
}

export function MatchResults({
  roomId,
  mode,
  currentRound,
  maxRounds,
  isHost,
  players,
  myClerkId,
  sharedScore,
}: MatchResultsProps) {
  const submitScore = useMutation(api.leaderboard.submit);
  const setPresence = useMutation(api.multiplayer.setPresence);
  const rematchMutation = useMutation(api.multiplayer.rematch);
  const [submitted, setSubmitted] = useState(false);
  const [rematchLoading, setRematchLoading] = useState(false);

  const me = players.find((p) => p.clerkId === myClerkId);
  const otherPlayers = players.filter((p) => p.clerkId !== myClerkId);

  const matchEndedEarly = currentRound < maxRounds;

  // Check disconnect outcomes
  const hasDisconnectOutcome = mode === "race" && matchEndedEarly &&
    players.some((p) => p.present === false);

  const selfPresentAtFinish = me?.present !== false;
  const allOthersAbsent = otherPlayers.every((p) => !p.present);
  const youWonByDefault = hasDisconnectOutcome && selfPresentAtFinish && allOthersAbsent;
  const youLostByDefault = hasDisconnectOutcome && !selfPresentAtFinish;

  // Sort players by score for race mode
  const rankedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players]
  );

  const winner = mode === "race" && rankedPlayers.length >= 2 && rankedPlayers[0].score !== rankedPlayers[1].score
    ? rankedPlayers[0]
    : null;

  // Any other player still present?
  const anyOtherPresent = otherPlayers.some((p) => p.present);

  // Mark self as present on mount, absent on leave
  const markAbsent = useCallback(() => {
    setPresence({ roomId, present: false }).catch(() => { });
  }, [roomId, setPresence]);

  useEffect(() => {
    setPresence({ roomId, present: true }).catch(() => { });

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

    const score = mode === "coop"
      ? sharedScore ?? 0
      : me?.score ?? 0;

    if (score > 0) {
      submitScore({
        score,
        accuracy: 75,
        level: maxRounds,
        pagesCompleted: maxRounds,
        leaderboardType: mode === "coop" ? "coop" : "solo",
      })
        .then(() => toast.success("Score saved to leaderboard!"))
        .catch(() => { /* silent */ });
    }
  }, [hasDisconnectOutcome, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

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
                    ? "You left during the match. Remaining players win by default."
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
                    {winner.username} Wins!
                  </GlowText>
                ) : (
                  <GlowText as="h2" color="amber" intensity="high" className="font-mono text-2xl font-bold uppercase">
                    It&apos;s a Tie!
                  </GlowText>
                )}
              </div>

              {/* Ranked scoreboard */}
              <div className="space-y-3">
                {rankedPlayers.map((player, idx) => (
                  <div
                    key={player.clerkId}
                    className={`flex items-center justify-center gap-4 ${
                      idx === 0 && winner ? "scale-110" : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-text-ghost w-6 text-right">
                      #{idx + 1}
                    </span>
                    <img src={player.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                    <span className="font-mono text-sm text-text-secondary min-w-[100px] text-left">
                      {player.username}
                    </span>
                    <GlowText
                      as="span"
                      color={idx === 0 ? "green" : "amber"}
                      intensity={idx === 0 ? "high" : "medium"}
                      className="font-mono text-2xl font-bold min-w-[80px]"
                    >
                      {player.score}
                    </GlowText>
                  </div>
                ))}
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

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {players.map((player, idx) => (
                  <div key={player.clerkId} className="flex items-center gap-2">
                    {idx > 0 && <span className="font-mono text-text-ghost">&</span>}
                    <img src={player.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
                  </div>
                ))}
              </div>

              <GlowText as="p" color="green" intensity="high" className="font-mono text-4xl font-bold">
                {sharedScore ?? 0}
              </GlowText>
              <p className="font-mono text-sm text-text-secondary">
                Combined score over {maxRounds} rounds
              </p>
            </>
          )}

          {/* Other players presence */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            {otherPlayers.map((player) => (
              <div
                key={player.clerkId}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  player.present
                    ? "border-archive/30 bg-archive/5"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Circle
                  className={`h-2 w-2 ${
                    player.present
                      ? "text-archive fill-archive"
                      : "text-text-ghost fill-text-ghost"
                  }`}
                />
                <span className={`font-mono text-xs ${player.present ? "text-archive" : "text-text-ghost"}`}>
                  {player.username}
                </span>
              </div>
            ))}
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
