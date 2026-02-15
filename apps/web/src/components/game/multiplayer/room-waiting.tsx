"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Loader2, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";

interface RoomWaitingProps {
  roomCode: string;
  roomId: Id<"multiplayerRooms">;
  hostUsername: string;
  hostAvatarUrl: string;
  mode: "race" | "coop";
}

export function RoomWaiting({
  roomCode,
  roomId,
  hostUsername,
  hostAvatarUrl,
  mode,
}: RoomWaitingProps) {
  const router = useRouter();
  const leaveRoom = useMutation(api.multiplayer.leaveRoom);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    try {
      await leaveRoom({ roomId });
    } catch {
      // ignore
    }
    router.push("/multiplayer");
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <TerminalPanel title="WAITING FOR OPPONENT" glowColor="cyan">
        <div className="p-8 text-center space-y-6">
          {/* Room code */}
          <div>
            <p className="font-mono text-xs text-text-ghost uppercase tracking-wider mb-3">
              Share this code
            </p>
            <button
              onClick={handleCopy}
              className="group inline-flex items-center gap-3 px-6 py-3 border border-scan/30 bg-scan/5 hover:bg-scan/10 transition-colors"
            >
              <GlowText
                as="span"
                color="cyan"
                intensity="high"
                className="font-mono text-4xl font-bold tracking-[0.5em]"
              >
                {roomCode}
              </GlowText>
              {copied ? (
                <Check className="h-5 w-5 text-archive" />
              ) : (
                <Copy className="h-5 w-5 text-text-ghost group-hover:text-scan transition-colors" />
              )}
            </button>
          </div>

          {/* Host info */}
          <div className="flex items-center justify-center gap-2">
            <img src={hostAvatarUrl} alt="" className="h-6 w-6 rounded-full" />
            <span className="font-mono text-sm text-text-secondary">{hostUsername}</span>
            <span className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border border-white/10 text-text-ghost">
              host
            </span>
          </div>

          {/* Mode badge */}
          <div>
            <span className={`px-3 py-1 font-mono text-xs uppercase tracking-wider border ${
              mode === "race"
                ? "border-scan/40 text-scan"
                : "border-archive/40 text-archive"
            }`}>
              {mode === "race" ? "Race Mode" : "Co-op Mode"} — Best of 5
            </span>
          </div>

          {/* Waiting indicator */}
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center justify-center gap-2 text-text-ghost"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-sm">Waiting for opponent to join...</span>
          </motion.div>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-text-ghost hover:text-decay transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </TerminalPanel>
    </div>
  );
}
