"use client";

import type { FactCheckData } from "@/lib/types";

interface SentimentAnalyzerProps {
  data: FactCheckData;
}

export function SentimentAnalyzer({ data }: SentimentAnalyzerProps) {
  const score = data.emotionalLanguageScore;
  const color =
    score > 60
      ? "text-decay"
      : score > 30
        ? "text-amber"
        : "text-archive";
  const barColor =
    score > 60
      ? "bg-decay"
      : score > 30
        ? "bg-amber"
        : "bg-archive";
  const label =
    score > 60
      ? "Highly Manipulative"
      : score > 30
        ? "Moderate Bias"
        : "Neutral Tone";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-secondary">
          Emotional Language
        </span>
        <span className={`font-mono text-xs font-bold ${color}`}>
          {score}/100 — {label}
        </span>
      </div>

      {/* Sentiment bar */}
      <div className="h-1.5 bg-elevated/60 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-xs text-text-ghost font-sans leading-relaxed">
        {score > 60
          ? "This content uses emotionally charged language designed to provoke reaction rather than inform. Exercise caution."
          : score > 30
            ? "Some emotional language detected. The author may be presenting a subjective viewpoint. Cross-reference key claims."
            : "Language appears measured and factual. Minimal emotional manipulation detected."}
      </p>
    </div>
  );
}
