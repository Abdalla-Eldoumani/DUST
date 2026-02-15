"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Github, Brain, Archive, Timer } from "lucide-react";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { FireBarrier } from "@/components/ui/fire-barrier";

const TOPICS = [
  {
    icon: Brain,
    title: "Critical Thinking",
    description:
      "Players evaluate sources, spot misinformation, cross-reference claims, and make evidence-based archive decisions under time pressure.",
    color: "text-scan",
  },
  {
    icon: Archive,
    title: "Archives & Preservation",
    description:
      "The entire gameplay loop IS digital preservation — players build a curated archive from a crumbling web.",
    color: "text-archive",
  },
  {
    icon: Timer,
    title: 'Game: "Impermanence"',
    description:
      "Content visually decays in real-time as the core mechanic. Unarchived pages are lost forever. Impermanence isn't just a theme — it's the engine.",
    color: "text-amber",
  },
];

const TECH_STACK = [
  { name: "Next.js 16", role: "Framework" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "Framer Motion", role: "Animations" },
  { name: "Zustand", role: "State Management" },
  { name: "Convex", role: "Real-time Backend" },
  { name: "Clerk", role: "Authentication" },
  { name: "Claude API", role: "Content Generation" },
];

export default function AboutPage() {
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
            color="green"
            intensity="medium"
            className="font-mono text-3xl font-bold uppercase tracking-wider"
          >
            About DUST
          </GlowText>
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="font-serif text-lg text-text-secondary leading-relaxed mb-4">
            DUST is a web game where you play as a digital archaeologist racing
            to save a decaying internet. Websites visually corrupt in real-time
            — text garbles, images pixelate, layouts shatter.
          </p>
          <p className="font-serif text-lg text-text-secondary leading-relaxed">
            You must critically evaluate content for misinformation, then
            archive the truth before it&apos;s lost forever. Archive a lie, and
            you pollute history.
          </p>
        </motion.div>

        {/* Topic alignment */}
        <div className="space-y-3 mb-8">
          <h2 className="font-mono text-xs text-text-ghost uppercase tracking-wider mb-3">
            Hackathon Topic Alignment
          </h2>
          {TOPICS.map((topic, i) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <TerminalPanel variant="compact">
                <div className="flex gap-3">
                  <topic.icon className={`h-5 w-5 shrink-0 ${topic.color}`} />
                  <div>
                    <h3 className="font-mono text-sm font-bold text-text-primary mb-1">
                      {topic.title}
                    </h3>
                    <p className="font-sans text-xs text-text-secondary leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>
              </TerminalPanel>
            </motion.div>
          ))}
        </div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <TerminalPanel title="TECH STACK" variant="compact" glowColor="cyan">
            <div className="grid grid-cols-2 gap-1.5">
              {TECH_STACK.map(({ name, role }) => (
                <div key={name} className="flex justify-between text-xs">
                  <span className="font-mono text-text-primary">{name}</span>
                  <span className="font-sans text-text-ghost">{role}</span>
                </div>
              ))}
            </div>
          </TerminalPanel>
        </motion.div>

        {/* Game Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <TerminalPanel title="FEATURES" variant="compact" glowColor="amber">
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Solo play</span>
                <span className="text-text-ghost">10 levels across 4 difficulty tiers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Lifelines</span>
                <span className="text-text-ghost">Verify · Freeze · Purge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Race mode</span>
                <span className="text-text-ghost">Head-to-head speed competition</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Co-op mode</span>
                <span className="text-text-ghost">Shared energy, combined score</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Multiplayer</span>
                <span className="text-text-ghost">Up to 5 players per room</span>
              </div>
            </div>
          </TerminalPanel>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <TerminalPanel title="TEAM" variant="compact" glowColor="green">
            <p className="font-sans text-sm text-text-secondary mb-3">
              Built at Calgary Hacks 2026
            </p>
            <div className="font-mono text-xs text-text-ghost space-y-1">
              <div>Abdalla ElDoumani</div>
              <div>Nathan Campbell</div>
              <div>Jerry Mukalel</div>
              <div>Varun Sharma</div>
            </div>
          </TerminalPanel>
        </motion.div>

        {/* GitHub link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <a
            href="https://github.com/Abdalla-Eldoumani/DUST"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-sans text-sm text-text-ghost hover:text-text-secondary transition-colors"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </motion.div>
      </div>
    </div>
  );
}
