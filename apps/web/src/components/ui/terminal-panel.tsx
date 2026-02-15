"use client";

import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  title?: string;
  variant?: "default" | "compact" | "transparent";
  children: React.ReactNode;
  className?: string;
  glowColor?: "green" | "red" | "cyan" | "amber";
}

const glowBorders: Record<string, string> = {
  green: "border-archive/20 shadow-[0_0_15px_rgba(0,255,136,0.08)]",
  red: "border-decay/20 shadow-[0_0_15px_rgba(255,51,68,0.08)]",
  cyan: "border-scan/20 shadow-[0_0_15px_rgba(0,212,255,0.08)]",
  amber: "border-amber/20 shadow-[0_0_15px_rgba(255,170,0,0.08)]",
};

export function TerminalPanel({
  title,
  variant = "default",
  children,
  className,
  glowColor = "green",
}: TerminalPanelProps) {
  const isCompact = variant === "compact";
  const isTransparent = variant === "transparent";

  return (
    <div
      className={cn(
        "border overflow-hidden",
        isTransparent ? "bg-transparent" : "bg-surface/80 backdrop-blur-sm",
        glowBorders[glowColor],
        className
      )}
    >
      {/* Title bar */}
      {title && (
        <div
          className={cn(
            "flex items-center gap-2 border-b border-white/5",
            isCompact ? "px-3 py-1.5" : "px-4 py-2"
          )}
          style={{ backgroundColor: "rgba(6, 6, 10, 0.6)" }}
        >
          {/* Terminal dots */}
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-decay/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-archive/70" />
          </div>
          <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
            {title}
          </span>
        </div>
      )}

      {/* Content */}
      <div className={cn(isCompact ? "p-3" : "p-4")}>{children}</div>
    </div>
  );
}
