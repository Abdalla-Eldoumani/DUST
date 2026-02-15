"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Search,
  MousePointerClick,
  Trophy,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { FireBarrier } from "@/components/ui/fire-barrier";
import { useTextDecay } from "@/lib/decay/text-decay";

const STEPS = [
  {
    icon: Eye,
    title: "Observe the Decay",
    description:
      "Web pages appear — news articles, blog posts, wiki entries. They look real, but the data is degrading. Text corrupts, colors fade, layouts break apart. Read fast before the content is lost.",
    color: "cyan" as const,
    detail: "Pages decay faster as you level up. Easy mode gives you 60 seconds. Expert mode: 18.",
  },
  {
    icon: Search,
    title: "Spot the Lies",
    description:
      "Every page mixes truth with misinformation. Use four analysis tools — Source Scanner, Date Checker, Cross-Reference, and Sentiment Analyzer — to identify what's real and what's fabricated.",
    color: "amber" as const,
    detail: "No tool is 100% reliable. Combine insights from multiple tools to form your judgment.",
  },
  {
    icon: MousePointerClick,
    title: "Use Your Tools",
    description:
      "Click sections you believe are TRUE to mark them for archiving. Each section costs archive energy — you can't save everything. Choose wisely: archive truth and earn points, archive misinformation and lose more.",
    color: "green" as const,
    detail: "+100 for truth, -150 for lies. Build combos for bonus multipliers.",
  },
  {
    icon: Trophy,
    title: "Archive the Truth",
    description:
      "Hit the ARCHIVE button to lock in your selections. The truth is revealed — correct archives glow green, mistakes glow red. Your score accumulates as you build the most accurate archive possible.",
    color: "green" as const,
    detail: "Clutch saves (archiving in the last 10% of decay) earn +50 bonus points.",
  },
];

function DecayDemo() {
  const sampleText =
    "The internet is vast, containing billions of pages of knowledge accumulated over decades of human effort.";
  const [progress, setProgress] = useState(0);
  const decayedText = useTextDecay(sampleText, progress, 3);

  return (
    <div className="space-y-3">
      <div className="border border-white/10 bg-elevated/30 p-4 font-serif text-sm text-text-secondary leading-relaxed min-h-[60px]">
        {decayedText}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-text-ghost whitespace-nowrap">
          DECAY: {Math.round(progress * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progress * 100)}
          onChange={(e) => setProgress(Number(e.target.value) / 100)}
          className="flex-1 h-1 appearance-none bg-white/10 rounded [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-scan"
        />
      </div>
    </div>
  );
}

function ToolsDemo() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const tools = [
    { id: "source", label: "Source", result: "Credibility: 35% — No credible byline found", icon: Search },
    { id: "date", label: "Date", result: "Timeline consistent — no anachronisms detected", icon: Eye },
    { id: "cross-ref", label: "Cross-Ref", result: "2 conflicts found with known data", icon: MousePointerClick },
    { id: "sentiment", label: "Sentiment", result: "Emotional score: 65% — moderate bias detected", icon: Trophy },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(activeTool === t.id ? null : t.id)}
            className={`p-2 border font-mono text-[11px] uppercase tracking-wide transition-all ${
              activeTool === t.id
                ? "bg-scan/10 border-scan/35 text-scan"
                : "bg-elevated/20 border-white/5 text-text-ghost hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {activeTool && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-scan/20 bg-scan/5 p-2 font-mono text-xs text-scan"
          >
            {tools.find((t) => t.id === activeTool)?.result}
          </motion.div>
        )}
      </AnimatePresence>
      {!activeTool && (
        <p className="text-center font-sans text-xs text-text-ghost py-2">
          Click a tool to see its analysis
        </p>
      )}
    </div>
  );
}

function ArchiveDemo() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const sections = [
    { text: "Water reserves have reached unprecedented levels.", isTrue: false },
    { text: "2.2 billion people lack safe drinking water.", isTrue: true },
    { text: "Climate change intensifies flooding and droughts.", isTrue: true },
  ];

  return (
    <div className="space-y-2">
      {sections.map((s, i) => (
        <button
          key={i}
          onClick={() => {
            const next = new Set(selected);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            setSelected(next);
          }}
          className={`w-full text-left p-2 border font-serif text-xs leading-relaxed transition-all ${
            selected.has(i)
              ? "bg-archive/5 border-archive/30 text-text-primary"
              : "bg-elevated/20 border-white/5 text-text-secondary hover:border-white/15"
          }`}
        >
          {s.text}
          {selected.has(i) && (
            <span className="ml-1 font-mono text-archive text-[10px]">SELECTED</span>
          )}
        </button>
      ))}
      <p className="font-mono text-[10px] text-text-ghost">
        {selected.size === 0
          ? "Click sections to mark for archiving"
          : `${selected.size} selected — only archive what you believe is TRUE`}
      </p>
    </div>
  );
}

function ScoringDemo() {
  const [revealed, setRevealed] = useState(false);
  const results = [
    { text: "Water reserves unprecedented", correct: false, points: -150 },
    { text: "2.2B lack safe water", correct: true, points: 100 },
    { text: "Climate change + droughts", correct: true, points: 100 },
  ];

  return (
    <div className="space-y-2">
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3 font-mono text-sm uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
        >
          Reveal Results
        </button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex justify-between items-center p-2 border font-mono text-xs ${
                r.correct
                  ? "bg-archive/5 border-archive/30 text-archive"
                  : "bg-decay/5 border-decay/30 text-decay"
              }`}
            >
              <span>{r.correct ? "TRUE" : "FALSE"}: {r.text}</span>
              <span className="font-bold">{r.points > 0 ? "+" : ""}{r.points}</span>
            </div>
          ))}
          <div className="text-right font-mono text-sm text-text-primary pt-1">
            Round Score: <span className="text-archive font-bold">+50</span>
          </div>
          <button
            onClick={() => setRevealed(false)}
            className="text-xs font-sans text-text-ghost hover:text-text-secondary"
          >
            Reset demo
          </button>
        </motion.div>
      )}
    </div>
  );
}

const DEMOS = [DecayDemo, ToolsDemo, ArchiveDemo, ScoringDemo];

export default function HowToPlayPage() {
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  const DemoComponent = DEMOS[step]!;

  return (
    <div className="relative min-h-svh bg-void overflow-y-auto">
      <FireBarrier />
      <ScanlineOverlay />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <GlowText
            as="h1"
            color="cyan"
            intensity="medium"
            className="font-mono text-3xl font-bold uppercase tracking-wider"
          >
            How to Play
          </GlowText>
          <p className="mt-2 font-sans text-sm text-text-secondary">
            Learn the basics in under a minute
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "w-8 bg-scan"
                  : i < step
                    ? "w-2 bg-archive/60"
                    : "w-2 bg-white/20"
              }`}
            />
          ))}
          <span className="ml-auto font-mono text-xs text-text-ghost">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TerminalPanel
              title={current.title}
              variant="compact"
              glowColor={current.color === "cyan" ? "cyan" : current.color === "amber" ? "amber" : "green"}
            >
              <div className="space-y-4">
                <div className="flex gap-3">
                  <current.icon
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      current.color === "cyan"
                        ? "text-scan"
                        : current.color === "amber"
                          ? "text-amber"
                          : "text-archive"
                    }`}
                  />
                  <div>
                    <p className="font-sans text-sm text-text-secondary leading-relaxed">
                      {current.description}
                    </p>
                    <p className="mt-2 font-mono text-xs text-text-ghost">
                      {current.detail}
                    </p>
                  </div>
                </div>

                {/* Interactive demo */}
                <div className="border-t border-white/5 pt-4">
                  <p className="font-mono text-[10px] text-text-ghost uppercase tracking-wider mb-3">
                    Try it
                  </p>
                  <DemoComponent />
                </div>
              </div>
            </TerminalPanel>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-text-ghost hover:text-text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-2 font-mono text-xs uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link href="/play">
              <motion.div
                className="inline-flex items-center gap-2 px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider bg-archive/10 text-archive border border-archive/30 hover:bg-archive/20 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="h-4 w-4" />
                Start Playing
              </motion.div>
            </Link>
          )}
        </div>

        {/* Scoring quick reference */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <TerminalPanel title="SCORING" variant="compact" glowColor="green">
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-ghost">Archive truth</span>
                <span className="text-archive">+100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-ghost">Archive misinfo</span>
                <span className="text-decay">-150</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-ghost">Clutch save</span>
                <span className="text-amber">+50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-ghost">Combo bonus</span>
                <span className="text-scan">x streak</span>
              </div>
            </div>
          </TerminalPanel>
        </motion.div>
      </div>
    </div>
  );
}
