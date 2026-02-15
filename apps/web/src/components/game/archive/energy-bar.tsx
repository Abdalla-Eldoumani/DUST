"use client";

import { cn } from "@/lib/utils";

interface EnergyBarProps {
  current: number;
  max: number;
}

export function EnergyBar({ current, max }: EnergyBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color =
    pct > 60 ? "bg-archive" : pct > 30 ? "bg-amber" : "bg-decay";
  const textColor =
    pct > 60 ? "text-archive" : pct > 30 ? "text-amber" : "text-decay";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
          Archive Energy
        </span>
        <span className={cn("font-mono text-xs tabular-nums", textColor)}>
          {current}/{max}
        </span>
      </div>
      <div className="h-2 bg-elevated/60 overflow-hidden border border-white/5">
        <div
          className={cn("h-full transition-all duration-300", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
