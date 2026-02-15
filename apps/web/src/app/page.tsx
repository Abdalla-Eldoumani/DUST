"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlitchText } from "@/components/ui/glitch-text";
import { GlowText } from "@/components/ui/glow-text";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { ParticleField } from "@/components/ui/particle-field";
import { Play, BookOpen, Trophy, Info } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-void">
      {/* Background layers */}
      <ParticleField particleCount={80} />
      <ScanlineOverlay />

      {/* Faint grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <GlitchText
            text="DUST"
            intensity="medium"
            interval={4000}
            className="font-mono text-[8rem] sm:text-[10rem] md:text-[12rem] font-bold leading-none tracking-tighter text-text-primary glow-green"
          />
        </motion.div>

        {/* Tagline — letter by letter reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12 max-w-md text-center"
        >
          <GlowText
            as="p"
            color="green"
            intensity="low"
            className="font-serif text-lg sm:text-xl text-text-secondary leading-relaxed"
          >
            The internet is dying. You&apos;re the last archivist.
          </GlowText>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-2 font-sans text-sm text-text-ghost"
          >
            Save what matters — but archive a lie, and you pollute history.
          </motion.p>
        </motion.div>

        {/* Play button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/play">
            <motion.div
              className="group flex items-center gap-3 border border-archive/40 bg-archive/5 px-10 py-4 font-mono text-lg font-bold uppercase tracking-widest text-archive transition-all hover:bg-archive/10 hover:border-archive/60"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: [
                  "0 0 15px rgba(0,255,136,0.2)",
                  "0 0 30px rgba(0,255,136,0.4)",
                  "0 0 15px rgba(0,255,136,0.2)",
                ],
              }}
              transition={{
                boxShadow: { repeat: Infinity, duration: 2.5 },
              }}
            >
              <Play className="h-5 w-5" />
              <span>Play</span>
            </motion.div>
          </Link>
        </motion.div>

        {/* Navigation links */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="flex items-center gap-6 font-sans text-sm"
        >
          <Link
            href="/how-to-play"
            className="flex items-center gap-1.5 text-text-ghost transition-colors hover:text-text-secondary"
          >
            <BookOpen className="h-3.5 w-3.5" />
            How to Play
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 text-text-ghost transition-colors hover:text-text-secondary"
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-text-ghost transition-colors hover:text-text-secondary"
          >
            <Info className="h-3.5 w-3.5" />
            About
          </Link>
        </motion.nav>
      </div>

      {/* Bottom ambient text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-4 left-4 font-mono text-[10px] text-text-ghost/40 leading-relaxed"
      >
        <div>SYSTEM://archive-terminal-v0.1</div>
        <div>STATUS: degradation_detected</div>
        <div>SECTORS: 12,847 compromised</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-4 right-4 font-mono text-[10px] text-text-ghost/40 text-right leading-relaxed"
      >
        <div>Calgary Hacks 2026</div>
        <div>data integrity: failing</div>
      </motion.div>
    </div>
  );
}
