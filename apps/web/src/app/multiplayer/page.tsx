"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Plus, LogIn, Swords, Handshake } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
import { GlowText } from "@/components/ui/glow-text";
import { GlitchText } from "@/components/ui/glitch-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { ParticleField } from "@/components/ui/particle-field";

export default function MultiplayerLobby() {
  const router = useRouter();
  const createRoom = useMutation(api.multiplayer.createRoom);
  const joinRoom = useMutation(api.multiplayer.joinRoom);

  const [mode, setMode] = useState<"race" | "coop">("race");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { roomCode } = await createRoom({ mode });
      router.push(`/multiplayer/${roomCode}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create room");
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error("Room code must be 6 characters");
      return;
    }
    setJoining(true);
    try {
      const { roomCode } = await joinRoom({ roomCode: code });
      router.push(`/multiplayer/${roomCode}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join room");
      setJoining(false);
    }
  };

  return (
    <div className="relative min-h-svh bg-void">
      <ParticleField particleCount={50} />
      <ScanlineOverlay />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <GlitchText
            text="MULTIPLAYER"
            intensity="low"
            interval={6000}
            className="font-mono text-4xl font-bold tracking-wider text-scan"
          />
          <p className="mt-2 font-sans text-sm text-text-secondary">
            Race or cooperate with another archivist
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create room */}
          <TerminalPanel title="CREATE ROOM" glowColor="cyan">
            <div className="p-4 space-y-4">
              {/* Mode toggle */}
              <div>
                <label className="font-mono text-xs text-text-ghost uppercase tracking-wider mb-2 block">
                  Game Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("race")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider border transition-colors ${mode === "race"
                      ? "border-scan/60 bg-scan/10 text-scan"
                      : "border-white/10 text-text-ghost hover:border-white/20"
                      }`}
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Race
                  </button>
                  <button
                    onClick={() => setMode("coop")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider border transition-colors ${mode === "coop"
                      ? "border-archive/60 bg-archive/10 text-archive"
                      : "border-white/10 text-text-ghost hover:border-white/20"
                      }`}
                  >
                    <Handshake className="h-3.5 w-3.5" />
                    Co-op
                  </button>
                </div>
              </div>

              <p className="font-sans text-xs text-text-ghost">
                {mode === "race"
                  ? "Compete head-to-head. First to archive correctly gets a speed bonus."
                  : "Work together with shared energy. Combined score goes to the leaderboard."}
              </p>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 py-3 font-mono text-sm uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </TerminalPanel>

          {/* Join room */}
          <TerminalPanel title="JOIN ROOM" glowColor="green">
            <div className="p-4 space-y-4">
              <div>
                <label className="font-mono text-xs text-text-ghost uppercase tracking-wider mb-2 block">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="XXXXXX"
                  className="w-full bg-elevated border border-white/10 px-4 py-3 font-mono text-xl text-center text-text-primary tracking-[0.5em] uppercase placeholder:text-text-ghost/30 focus:outline-none focus:border-archive/40"
                  maxLength={6}
                />
              </div>

              <p className="font-sans text-xs text-text-ghost">
                Enter the 6-character room code shared by the host.
              </p>

              <button
                onClick={handleJoin}
                disabled={joining || joinCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                {joining ? "Joining..." : "Join Room"}
              </button>
            </div>
          </TerminalPanel>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
