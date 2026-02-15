"use client";

import type { FactCheckData } from "@/lib/types";

interface SourceScannerProps {
  data: FactCheckData;
}

export function SourceScanner({ data }: SourceScannerProps) {
  const credibility = data.sourceCredibility;
  const color =
    credibility > 70
      ? "text-archive"
      : credibility > 40
        ? "text-amber"
        : "text-decay";
  const barColor =
    credibility > 70
      ? "bg-archive"
      : credibility > 40
        ? "bg-amber"
        : "bg-decay";
  const label =
    credibility > 70
      ? "Reliable"
      : credibility > 40
        ? "Mixed"
        : "Unreliable";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-secondary">
          Source Credibility
        </span>
        <span className={`font-mono text-xs font-bold ${color}`}>
          {credibility}/100 — {label}
        </span>
      </div>

      {/* Credibility bar */}
      <div className="h-1.5 bg-elevated/60 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${credibility}%` }}
        />
      </div>

      <p className="text-xs text-text-ghost font-sans leading-relaxed">
        {data.authorHistory}
      </p>
    </div>
  );
}
