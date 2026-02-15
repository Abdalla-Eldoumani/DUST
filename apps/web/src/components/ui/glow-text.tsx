"use client";

import { cn } from "@/lib/utils";

type GlowColor = "green" | "red" | "cyan" | "amber" | "ghost";
type GlowIntensity = "low" | "medium" | "high";

const colorMap: Record<GlowColor, { text: string; shadow: (intensity: number) => string }> = {
  green: {
    text: "text-archive",
    shadow: (i) =>
      `0 0 ${10 * i}px rgba(0,255,136,0.5), 0 0 ${40 * i}px rgba(0,255,136,0.2)`,
  },
  red: {
    text: "text-decay",
    shadow: (i) =>
      `0 0 ${10 * i}px rgba(255,51,68,0.5), 0 0 ${40 * i}px rgba(255,51,68,0.2)`,
  },
  cyan: {
    text: "text-scan",
    shadow: (i) =>
      `0 0 ${10 * i}px rgba(0,212,255,0.5), 0 0 ${40 * i}px rgba(0,212,255,0.2)`,
  },
  amber: {
    text: "text-amber",
    shadow: (i) =>
      `0 0 ${10 * i}px rgba(255,170,0,0.5), 0 0 ${40 * i}px rgba(255,170,0,0.2)`,
  },
  ghost: {
    text: "text-ghost",
    shadow: (i) =>
      `0 0 ${10 * i}px rgba(139,92,246,0.5), 0 0 ${40 * i}px rgba(139,92,246,0.2)`,
  },
};

const intensityMap: Record<GlowIntensity, number> = {
  low: 0.5,
  medium: 1,
  high: 1.8,
};

interface GlowTextProps {
  children: React.ReactNode;
  color?: GlowColor;
  intensity?: GlowIntensity;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
  className?: string;
}

export function GlowText({
  children,
  color = "green",
  intensity = "medium",
  as: Tag = "span",
  className,
}: GlowTextProps) {
  const { text, shadow } = colorMap[color];
  const i = intensityMap[intensity];

  return (
    <Tag
      className={cn(text, className)}
      style={{ textShadow: shadow(i) }}
    >
      {children}
    </Tag>
  );
}
