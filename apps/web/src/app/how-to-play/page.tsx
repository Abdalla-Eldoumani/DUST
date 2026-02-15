"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Search,
  MousePointerClick,
  Trophy,
  Play,
} from "lucide-react";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { FireBarrier } from "@/components/ui/fire-barrier";

const STEPS = [
  {
    icon: Eye,
    title: "1. Observe the Page",
    description:
      "A web page appears — news article, blog post, social thread, or wiki entry. It looks real, but some claims are false. The page starts decaying immediately — text corrupts, colors fade, layout breaks apart.",
    color: "cyan" as const,
    detail: "Pages decay faster as you level up. Read quickly.",
  },
  {
    icon: Search,
    title: "2. Use Your Tools",
    description:
      "Four analysis tools help you spot misinformation: Source Scanner checks author credibility, Date Checker flags timeline issues, Cross-Reference compares claims to known facts, and Sentiment Analyzer detects manipulative language.",
    color: "amber" as const,
    detail: "No tool is 100% — combine insights to form your judgment.",
  },
  {
    icon: MousePointerClick,
    title: "3. Select & Archive",
    description:
      "Click sections you believe are TRUE to mark them for archiving. Each section costs archive energy — you can't save everything. Choose wisely: archive truth and earn points, archive misinformation and lose more.",
    color: "green" as const,
    detail: "+100 for truth, -150 for lies. Build combos for bonus multipliers.",
  },
  {
    icon: Trophy,
    title: "4. Build Your Archive",
    description:
      "After archiving, the truth is revealed. Correct archives glow green, mistakes glow red. Your score accumulates across pages as you build the most accurate archive possible.",
    color: "green" as const,
    detail: "Clutch saves (archiving in the last 10% of decay) earn bonus points.",
  },
];

export default function HowToPlayPage() {
  return (
    <div className="relative min-h-svh bg-void">
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

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <TerminalPanel
                title={step.title}
                variant="compact"
                glowColor={step.color === "cyan" ? "cyan" : step.color === "amber" ? "amber" : "green"}
              >
                <div className="flex gap-3">
                  <step.icon
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      step.color === "cyan"
                        ? "text-scan"
                        : step.color === "amber"
                          ? "text-amber"
                          : "text-archive"
                    }`}
                  />
                  <div>
                    <p className="font-sans text-sm text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                    <p className="mt-2 font-mono text-xs text-text-ghost">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </TerminalPanel>
            </motion.div>
          ))}
        </div>

        {/* Scoring quick reference */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
                <span className="text-scan">+25%/streak</span>
              </div>
            </div>
          </TerminalPanel>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
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
        </motion.div>
      </div>
    </div>
  );
}
