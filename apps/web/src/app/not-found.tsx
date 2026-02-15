"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlitchText } from "@/components/ui/glitch-text";
import { GlowText } from "@/components/ui/glow-text";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { ParticleField } from "@/components/ui/particle-field";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-void">
      {/* Background layers */}
      <ParticleField particleCount={40} />
      <ScanlineOverlay />

      {/* Faint grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,51,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,51,68,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* 404 title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-4"
        >
          <GlitchText
            text="404"
            intensity="high"
            interval={2500}
            className="font-mono text-[8rem] sm:text-[10rem] md:text-[14rem] font-bold leading-none tracking-tighter text-decay glow-red"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-6"
        >
          <GlowText
            as="h1"
            color="ghost"
            intensity="medium"
            className="font-mono text-xl sm:text-2xl uppercase tracking-[0.3em] text-text-secondary"
          >
            Page Lost to Decay
          </GlowText>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-12 max-w-md text-center font-serif text-base text-text-ghost leading-relaxed"
        >
          This sector has been corrupted beyond recovery. The data you&apos;re
          looking for has decayed into the void.
        </motion.p>

        {/* Return button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Link href="/">
            <motion.div
              className="group flex items-center gap-3 border border-scan/40 bg-scan/5 px-8 py-4 font-mono text-sm font-bold uppercase tracking-widest text-scan transition-all hover:bg-scan/10 hover:border-scan/60"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: [
                  "0 0 15px rgba(0,212,255,0.2)",
                  "0 0 30px rgba(0,212,255,0.4)",
                  "0 0 15px rgba(0,212,255,0.2)",
                ],
              }}
              transition={{
                boxShadow: { repeat: Infinity, duration: 2.5 },
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Archive</span>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom ambient text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-4 left-4 font-mono text-[10px] text-text-ghost/40 leading-relaxed"
      >
        <div>ERROR://sector_not_found</div>
        <div>STATUS: data_irrecoverable</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-4 right-4 font-mono text-[10px] text-text-ghost/40 text-right leading-relaxed"
      >
        <div>RECOVERY: impossible</div>
        <div>ARCHIVE: corrupted</div>
      </motion.div>
    </div>
  );
}
