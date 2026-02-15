"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";

const PING_EMOJIS = [
  { emoji: "👀", label: "Look" },
  { emoji: "⚠️", label: "Warning" },
  { emoji: "✅", label: "Good" },
  { emoji: "❌", label: "Fake" },
  { emoji: "⏰", label: "Hurry" },
  { emoji: "🎯", label: "Target" },
];

interface PingSystemProps {
  roomId: Id<"multiplayerRooms">;
  partnerPings: { emoji: string; timestamp: number }[];
}

export function PingSystem({ roomId, partnerPings }: PingSystemProps) {
  const submitAction = useMutation(api.multiplayer.submitAction);
  const [cooldown, setCooldown] = useState(false);

  const handlePing = async (emoji: string) => {
    if (cooldown) return;
    setCooldown(true);
    try {
      await submitAction({
        roomId,
        action: "ping",
        data: emoji,
      });
    } catch {
      // silent fail for pings
    }
    setTimeout(() => setCooldown(false), 1000);
  };

  return (
    <div className="space-y-2">
      {/* Incoming pings */}
      <AnimatePresence>
        {partnerPings.slice(-3).map((ping) => (
          <motion.div
            key={ping.timestamp}
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className="text-2xl"
          >
            {ping.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Ping buttons */}
      <div className="flex gap-1 flex-wrap">
        {PING_EMOJIS.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => handlePing(emoji)}
            disabled={cooldown}
            title={label}
            className="w-8 h-8 flex items-center justify-center text-base border border-white/10 hover:border-archive/30 hover:bg-archive/5 transition-colors disabled:opacity-40"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
