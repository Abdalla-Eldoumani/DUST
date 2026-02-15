"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { getRandomCachedPage } from "@/lib/content/content-cache";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";

interface RoundResultsProps {
  roomId: Id<"multiplayerRooms">;
  currentRound: number;
  maxRounds: number;
  mode: "race" | "coop";
  isHost: boolean;
  hostUsername: string;
  guestUsername: string;
  hostScore: number;
  guestScore: number;
  sharedScore?: number;
}

export function RoundResults({
  roomId,
  currentRound,
  maxRounds,
  mode,
  isHost,
  hostUsername,
  guestUsername,
  hostScore,
  guestScore,
  sharedScore,
}: RoundResultsProps) {
  const nextRound = useMutation(api.multiplayer.nextRound);
  const finishGame = useMutation(api.multiplayer.finishGame);
  const [advancing, setAdvancing] = useState(false);

  const isLastRound = currentRound >= maxRounds;

  // Auto-transition to match results after the final round (host triggers it)
  useEffect(() => {
    if (!isLastRound || !isHost) return;

    const timer = setTimeout(async () => {
      try {
        await finishGame({ roomId });
      } catch {
        // If it fails, the room may have already been transitioned
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLastRound, isHost, roomId, finishGame]);

  const handleNextRound = async () => {
    if (!isHost) return;
    setAdvancing(true);
    try {
      const content = getRandomCachedPage([], Math.min(3 + currentRound, 8));
      await nextRound({
        roomId,
        hostScoreAdd: 0,
        guestScoreAdd: 0,
        contentId: content.id,
      });
    } catch (err) {
      toast.error("Failed to advance round");
      setAdvancing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <TerminalPanel title={`ROUND ${currentRound} COMPLETE`} glowColor="amber">
        <div className="p-8 space-y-6 text-center">
          {mode === "race" ? (
            <>
              {/* Race scores */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="font-mono text-xs text-text-ghost uppercase mb-1">{hostUsername}</p>
                  <GlowText
                    as="p"
                    color={hostScore >= guestScore ? "green" : "amber"}
                    intensity="medium"
                    className="font-mono text-3xl font-bold"
                  >
                    {hostScore}
                  </GlowText>
                </div>
                <span className="font-mono text-text-ghost">vs</span>
                <div className="text-center">
                  <p className="font-mono text-xs text-text-ghost uppercase mb-1">{guestUsername}</p>
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

              {hostScore !== guestScore && (
                <p className="font-mono text-sm text-archive">
                  {hostScore > guestScore ? hostUsername : guestUsername} leads!
                </p>
              )}
            </>
          ) : (
            <>
              {/* Co-op combined score */}
              <GlowText as="p" color="green" intensity="high" className="font-mono text-4xl font-bold">
                {sharedScore ?? 0}
              </GlowText>
              <p className="font-mono text-sm text-text-secondary">Combined Team Score</p>
            </>
          )}

          <p className="font-mono text-xs text-text-ghost">
            Round {currentRound} of {maxRounds}
          </p>

          {/* Next round */}
          {isLastRound ? (
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="font-mono text-sm text-amber"
            >
              Final round complete — loading results...
            </motion.p>
          ) : isHost ? (
            <button
              onClick={handleNextRound}
              disabled={advancing}
              className="px-8 py-3 font-mono text-sm uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors disabled:opacity-50"
            >
              {advancing ? "Loading..." : `Next Round (${currentRound + 1}/${maxRounds})`}
            </button>
          ) : (
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-mono text-sm text-text-ghost"
            >
              Waiting for host to start next round...
            </motion.p>
          )}
        </div>
      </TerminalPanel>
    </div>
  );
}

