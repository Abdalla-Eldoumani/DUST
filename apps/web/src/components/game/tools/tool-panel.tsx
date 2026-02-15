"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { SourceScanner } from "./source-scanner";
import { DateChecker } from "./date-checker";
import { CrossReference } from "./cross-reference";
import { SentimentAnalyzer } from "./sentiment-analyzer";
import type { FactCheckData } from "@/lib/types";
import { Search, Calendar, GitCompare, Brain } from "lucide-react";

interface ToolPanelProps {
  factCheckData: FactCheckData | null;
  decayProgress: number;
}

type ToolId = "source" | "date" | "cross-ref" | "sentiment";

const TOOLS = [
  { id: "source" as ToolId, label: "Source Scanner", icon: Search },
  { id: "date" as ToolId, label: "Date Checker", icon: Calendar },
  { id: "cross-ref" as ToolId, label: "Cross-Reference", icon: GitCompare },
  { id: "sentiment" as ToolId, label: "Sentiment", icon: Brain },
];

export function ToolPanel({ factCheckData, decayProgress }: ToolPanelProps) {
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
    <TerminalPanel title="ANALYSIS TOOLS" variant="compact" glowColor="cyan">
      {/* Tool buttons */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleToolClick(id)}
            className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-sans transition-all border ${
              activeTool === id
                ? "bg-scan/10 border-scan/30 text-scan"
                : usedTools.has(id)
                  ? "bg-elevated/30 border-white/5 text-text-secondary"
                  : "bg-elevated/20 border-white/5 text-text-ghost hover:text-text-secondary hover:border-white/10"
            }`}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Tool results */}
      <AnimatePresence mode="wait">
        {activeTool && factCheckData && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 pt-3"
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
        <p className="text-xs text-text-ghost font-sans mt-1">
          Select a tool to analyze this page
        </p>
      )}
    </TerminalPanel>
  );
}
