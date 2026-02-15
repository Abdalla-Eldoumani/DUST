"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { SourceScanner } from "./source-scanner";
import { DateChecker } from "./date-checker";
import { CrossReference } from "./cross-reference";
import { SentimentAnalyzer } from "./sentiment-analyzer";
import type { FactCheckData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, Calendar, GitCompare, Brain } from "lucide-react";

interface ToolPanelProps {
  factCheckData: FactCheckData | null;
  decayProgress: number;
  className?: string;
}

type ToolId = "source" | "date" | "cross-ref" | "sentiment";

const TOOLS = [
  {
    id: "source" as ToolId,
    label: "Source Scanner",
    hint: "Check author trust and credibility history.",
    icon: Search,
  },
  {
    id: "date" as ToolId,
    label: "Date Checker",
    hint: "Validate timeline consistency and chronology.",
    icon: Calendar,
  },
  {
    id: "cross-ref" as ToolId,
    label: "Cross-Reference",
    hint: "Compare claims against known supporting facts.",
    icon: GitCompare,
  },
  {
    id: "sentiment" as ToolId,
    label: "Sentiment Analyzer",
    hint: "Detect emotional manipulation and bias signals.",
    icon: Brain,
  },
];

export function ToolPanel({
  factCheckData,
  decayProgress,
  className,
}: ToolPanelProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [usedTools, setUsedTools] = useState<Set<ToolId>>(new Set());

  const handleToolClick = (toolId: ToolId) => {
    if (activeTool === toolId) {
      setActiveTool(null);
    } else {
      setActiveTool(toolId);
      setUsedTools((prev) => new Set(prev).add(toolId));
    }
  };

  return (
    <TerminalPanel
      title="ANALYSIS TOOLS"
      variant="compact"
      glowColor="cyan"
      className={cn("h-full", className)}
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Tool buttons */}
        <div className="space-y-2">
          {TOOLS.map(({ id, label, hint, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleToolClick(id)}
              className={cn(
                "w-full min-h-[62px] border p-2.5 text-left transition-all",
                activeTool === id
                  ? "bg-scan/10 border-scan/35 text-scan"
                  : usedTools.has(id)
                    ? "bg-elevated/30 border-white/10 text-text-secondary"
                    : "bg-elevated/20 border-white/5 text-text-ghost hover:text-text-secondary hover:border-white/15"
              )}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wide">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs font-sans leading-snug",
                      activeTool === id
                        ? "text-scan/90"
                        : "text-text-ghost"
                    )}
                  >
                    {hint}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <p
          className={cn(
            "mt-2 font-mono text-[11px] uppercase tracking-wide",
            decayProgress >= 0.75 ? "text-decay" : "text-text-ghost"
          )}
        >
          Integrity remaining: {Math.max(0, Math.round((1 - decayProgress) * 100))}%
        </p>

        {/* Tool results */}
        <div className="mt-3 min-h-[120px] border-t border-white/5 pt-3">
          <AnimatePresence mode="wait">
            {activeTool && factCheckData && (
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTool === "source" && (
                  <SourceScanner data={factCheckData} />
                )}
                {activeTool === "date" && (
                  <DateChecker data={factCheckData} />
                )}
                {activeTool === "cross-ref" && (
                  <CrossReference data={factCheckData} />
                )}
                {activeTool === "sentiment" && (
                  <SentimentAnalyzer data={factCheckData} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!activeTool && (
            <div className="flex min-h-[120px] items-center justify-center border border-dashed border-white/10 bg-elevated/10 px-3">
              <p className="text-center text-sm text-text-ghost font-sans">
                Select a tool to analyze this page
              </p>
            </div>
          )}
        </div>
      </div>
    </TerminalPanel>
  );
}
