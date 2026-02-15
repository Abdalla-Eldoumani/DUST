"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Swords, Handshake } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import type { PlayerInfo } from "@/app/multiplayer/[code]/page";

const PROJECT_ID = "calgaryhacks2026";
const ROUND_DIFFICULTY_SEQUENCE = [1, 3, 5, 7, 9] as const;

function difficultyForRound(round: number): number {
  const idx = Math.max(0, Math.min(round - 1, ROUND_DIFFICULTY_SEQUENCE.length - 1));
  return ROUND_DIFFICULTY_SEQUENCE[idx]!;
}

function levelIdForDifficulty(projectId: string, difficulty: number): string {
  return `${projectId}_level_${difficulty.toString().padStart(2, "0")}`;
}

interface RoomLobbyProps {
  roomId: Id<"multiplayerRooms">;
  roomCode: string;
  mode: "race" | "coop";
  isHost: boolean;
  players: PlayerInfo[];
}

export function RoomLobby({
  roomId,
  roomCode,
  mode,
  isHost,
  players,
}: RoomLobbyProps) {
  const startGame = useMutation(api.multiplayer.startGame);
  const variantCounts = useQuery(api.pageVariants.countValidByProject, {
    projectId: PROJECT_ID,
  });
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const firstRoundDifficulty = difficultyForRound(1);
      const levelId = levelIdForDifficulty(PROJECT_ID, firstRoundDifficulty);
      if (!variantCounts) {
        throw new Error("Still loading archive variants. Please try again.");
      }
      if ((variantCounts[levelId] ?? 0) <= 0) {
        throw new Error(
          `No Convex variants found for difficulty ${firstRoundDifficulty}.`
        );
      }
      await startGame({ roomId, contentId: levelId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start game");
      setStarting(false);
    }
  };

  const separator = mode === "race" ? "VS" : "&";

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <TerminalPanel title={`ROOM ${roomCode}`} glowColor="cyan">
        <div className="p-8 space-y-8">
          {/* Mode badge */}
          <div className="text-center">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 font-mono text-xs uppercase tracking-wider border ${
              mode === "race"
                ? "border-scan/40 text-scan"
                : "border-archive/40 text-archive"
            }`}>
              {mode === "race" ? <Swords className="h-3.5 w-3.5" /> : <Handshake className="h-3.5 w-3.5" />}
              {mode === "race" ? "Race Mode" : "Co-op Mode"} — Best of 5 Rounds
            </span>
          </div>

          {/* Players */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {players.map((player, idx) => (
              <div key={player.clerkId} className="flex items-center gap-4">
                {idx > 0 && (
                  <GlowText
                    as="span"
                    color="amber"
                    intensity="medium"
                    className="font-mono text-2xl font-bold text-amber"
                  >
                    {separator}
                  </GlowText>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <img
                    src={player.avatarUrl}
                    alt=""
                    className={`h-16 w-16 rounded-full border-2 ${
                      player.isHost ? "border-scan/40" : "border-archive/40"
                    }`}
                  />
                  <span className="font-mono text-sm text-text-primary">{player.username}</span>
                  <span className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border ${
                    player.isHost
                      ? "border-scan/30 text-scan"
                      : "border-archive/30 text-archive"
                  }`}>
                    {player.isHost ? "Host" : `Player ${player.joinOrder + 1}`}
                  </span>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Start button or waiting message */}
          <div className="text-center">
            {isHost ? (
              <button
                onClick={handleStart}
                disabled={starting}
                className="inline-flex items-center gap-2 px-8 py-3 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {starting ? "Starting..." : "Start Game"}
              </button>
            ) : (
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="font-mono text-sm text-text-ghost"
              >
                Waiting for host to start...
              </motion.p>
            )}
          </div>
        </div>
      </TerminalPanel>
    </div>
  );
}
