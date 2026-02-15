"use client";

import { cn } from "@/lib/utils";
import { useTextDecay } from "@/lib/decay/text-decay";
import { Globe, Lock, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface PageChromeProps {
  url: string;
  title: string;
  decayProgress: number;
  children: React.ReactNode;
  className?: string;
}

export function PageChrome({
  url,
  title,
  decayProgress,
  children,
  className,
}: PageChromeProps) {
  const decayedUrl = useTextDecay(url, decayProgress, 2);
  const decayedTitle = useTextDecay(title, decayProgress, 4);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border border-white/10 bg-surface/80",
        className
      )}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-[#0d1117] px-3 py-1.5 border-b border-white/5">
        <div className="flex items-center gap-0.5 max-w-[200px] bg-elevated/60 px-3 py-1 rounded-t text-xs">
          <Globe className="h-3 w-3 text-text-ghost mr-1.5 shrink-0" />
          <span className="truncate font-sans text-text-secondary">
            {decayedTitle}
          </span>
        </div>
        <div className="h-4 w-4 flex items-center justify-center text-text-ghost hover:text-text-secondary cursor-default">
          +
        </div>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117]/80 border-b border-white/5">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1 text-text-ghost">
          <ChevronLeft className="h-3.5 w-3.5" />
          <ChevronRight className="h-3.5 w-3.5" />
          <RotateCw className="h-3 w-3 ml-1" />
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-elevated/40 px-3 py-1 rounded-sm border border-white/5">
          <Lock className="h-3 w-3 text-archive/60 shrink-0" />
          <span className="font-mono text-xs text-text-secondary truncate">
            {decayedUrl}
          </span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e17]">{children}</div>
    </div>
  );
}
