"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, LogIn, Swords, Handshake } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { toast } from "sonner";
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

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-10 text-center md:mb-12">
          <GlitchText
            text="MULTIPLAYER"
            intensity="low"
            interval={6000}
            className="font-mono text-5xl font-bold tracking-[0.12em] text-scan md:text-7xl"
          />
          <p className="mt-3 font-serif text-base text-text-secondary md:text-xl">
            Race or cooperate with another archivist
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Create room */}
          <TerminalPanel title="CREATE ROOM" glowColor="cyan">
            <div className="space-y-6 p-4 md:p-6">
              {/* Mode toggle */}
              <div>
                <label className="mb-3 block font-mono text-sm text-text-ghost uppercase tracking-wider">
                  Game Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("race")}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 font-mono text-sm uppercase tracking-wider border transition-colors ${mode === "race"
                      ? "border-scan/60 bg-scan/10 text-scan"
                      : "border-white/10 text-text-ghost hover:border-white/20"
                      }`}
                  >
                    <Swords className="h-4 w-4" />
                    Race
                  </button>
                  <button
                    onClick={() => setMode("coop")}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 font-mono text-sm uppercase tracking-wider border transition-colors ${mode === "coop"
                      ? "border-archive/60 bg-archive/10 text-archive"
                      : "border-white/10 text-text-ghost hover:border-white/20"
                      }`}
                  >
                    <Handshake className="h-4 w-4" />
                    Co-op
                  </button>
                </div>
              </div>

              <p className="font-sans text-sm leading-relaxed text-text-ghost md:text-base">
                {mode === "race"
                  ? "Compete head-to-head. First to archive correctly gets a speed bonus."
                  : "Work together with shared energy. Combined score goes to the leaderboard."}
              </p>
              <p className="font-sans text-xs text-text-ghost/60 md:text-sm">
                Maximum of 5 players per room.
              </p>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 py-4 font-mono text-lg uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                {creating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </TerminalPanel>

          {/* Join room */}
          <TerminalPanel title="JOIN ROOM" glowColor="green">
            <div className="space-y-6 p-4 md:p-6">
              <div>
                <label className="mb-3 block font-mono text-sm text-text-ghost uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="XXXXXX"
                  className="w-full bg-elevated border border-white/10 px-4 py-4 font-mono text-2xl text-center text-text-primary tracking-[0.5em] uppercase placeholder:text-text-ghost/30 focus:outline-none focus:border-archive/40"
                  maxLength={6}
                />
              </div>

              <p className="font-sans text-sm leading-relaxed text-text-ghost md:text-base">
                Enter the 6-character room code shared by the host.
              </p>

              <button
                onClick={handleJoin}
                disabled={joining || joinCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-4 font-mono text-lg uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors disabled:opacity-50"
              >
                <LogIn className="h-5 w-5" />
                {joining ? "Joining..." : "Join Room"}
              </button>
            </div>
          </TerminalPanel>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base text-text-ghost hover:text-text-secondary transition-colors font-sans md:text-xl"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
