"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Swords, Handshake } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { getRandomCachedPage } from "@/lib/content/content-cache";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";

interface RoomLobbyProps {
  roomId: Id<"multiplayerRooms">;
  roomCode: string;
  mode: "race" | "coop";
  isHost: boolean;
  hostUsername: string;
  hostAvatarUrl: string;
  guestUsername: string;
  guestAvatarUrl: string;
}

export function RoomLobby({
  roomId,
  roomCode,
  mode,
  isHost,
  hostUsername,
  hostAvatarUrl,
  guestUsername,
  guestAvatarUrl,
}: RoomLobbyProps) {
  const startGame = useMutation(api.multiplayer.startGame);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const content = getRandomCachedPage([], 3);
      await startGame({ roomId, contentId: content.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start game");
      setStarting(false);
    }
  };

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
          <div className="flex items-center justify-center gap-8">
            {/* Host */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <img src={hostAvatarUrl} alt="" className="h-16 w-16 rounded-full border-2 border-scan/40" />
              <span className="font-mono text-sm text-text-primary">{hostUsername}</span>
              <span className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border border-scan/30 text-scan">
                Host
              </span>
            </motion.div>

            {/* VS */}
            <GlowText
              as="span"
              color="amber"
              intensity="medium"
              className="font-mono text-2xl font-bold text-amber"
            >
              {mode === "race" ? "VS" : "&"}
            </GlowText>

            {/* Guest */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <img src={guestAvatarUrl} alt="" className="h-16 w-16 rounded-full border-2 border-archive/40" />
              <span className="font-mono text-sm text-text-primary">{guestUsername}</span>
              <span className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border border-archive/30 text-archive">
                Guest
              </span>
            </motion.div>
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
