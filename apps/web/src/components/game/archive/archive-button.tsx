"use client";

import { motion } from "framer-motion";
import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveButtonProps {
  selectedCount: number;
  disabled: boolean;
  onArchive: () => void;
}

export function ArchiveButton({
  selectedCount,
  disabled,
  onArchive,
}: ArchiveButtonProps) {
  return (
    <motion.button
      onClick={onArchive}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all border",
        disabled
          ? "bg-elevated/30 text-text-ghost border-white/5 cursor-not-allowed"
          : "bg-archive/10 text-archive border-archive/30 hover:bg-archive/20 hover:border-archive/50"
      )}
      whileTap={disabled ? {} : { scale: 0.97 }}
      animate={
        disabled
          ? {}
          : {
              boxShadow: [
                "0 0 10px rgba(0,255,136,0.2)",
                "0 0 20px rgba(0,255,136,0.4)",
                "0 0 10px rgba(0,255,136,0.2)",
              ],
            }
      }
      transition={
        disabled
          ? {}
          : { boxShadow: { repeat: Infinity, duration: 2 } }
      }
    >
      <Archive className="h-4 w-4" />
      <span>
        {selectedCount > 0
          ? `Archive ${selectedCount} Section${selectedCount > 1 ? "s" : ""}`
          : "Select Sections to Archive"}
      </span>
    </motion.button>
  );
}
