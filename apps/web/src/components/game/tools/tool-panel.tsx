"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { DateChecker } from "./date-checker";
import { CrossReference } from "./cross-reference";
import { SentimentAnalyzer } from "./sentiment-analyzer";
import type { FactCheckData, PageSection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, GitCompare, Brain } from "lucide-react";

interface ToolPanelProps {
  factCheckData: FactCheckData | null;
  sections: PageSection[];
  decayProgress: number;
  className?: string;
  selectedSectionId?: string | null;
}

type ToolId = "date" | "cross-ref" | "sentiment";

const TOOLS = [
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
  sections,
  decayProgress,
  className,
  selectedSectionId,
}: ToolPanelProps) {
  const selectedSection = selectedSectionId && sections
    ? sections.find((s) => s.id === selectedSectionId)
    : null;
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

        {!activeTool && (
          <p className="mt-3 text-xs font-sans text-text-ghost">
            Select a tool to open analysis details.
          </p>
        )}

        {/* Sliding tool details panel */}
        <AnimatePresence initial={false}>
          {activeTool && (
            <motion.div
              key="tool-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-3 overflow-hidden"
            >
              <div className="border-t border-white/5 pt-3">
                {factCheckData ? (
                  <motion.div
                    key={activeTool}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
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
                ) : (
                  <div className="border border-dashed border-white/10 bg-elevated/10 px-3 py-4">
                    <p className="text-sm text-text-ghost font-sans">
                      Analysis data is unavailable for this page.
                    </p>
                  </div>
                )}

                {/* Per-section analysis hint */}
                {selectedSection && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 border border-white/5 bg-elevated/20 p-2"
                  >
                    <p className="mb-1 font-mono text-[10px] text-text-ghost uppercase tracking-wider">
                      Section Analysis
                    </p>
                    <p className="font-sans text-xs text-text-secondary leading-relaxed">
                      {activeTool === "date" && (selectedSection.dateIssue || "No date inconsistencies found.")}
                      {activeTool === "cross-ref" && (selectedSection.crossRefIssue || "No cross-reference conflicts found.")}
                      {activeTool === "sentiment" && (selectedSection.emotionalLanguage || "Language appears neutral.")}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TerminalPanel>
  );
}
