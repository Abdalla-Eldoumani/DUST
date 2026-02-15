"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
  interval?: number; // ms between glitch bursts
}

const GLITCH_CHARS = "▓░▒█╳◼◆●⌧⍜";

export function GlitchText({
  text,
  className,
  intensity = "medium",
  interval = 3000,
}: GlitchTextProps) {
  const [display, setDisplay] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchRate =
    intensity === "low" ? 0.05 : intensity === "medium" ? 0.1 : 0.2;

  const doGlitch = useCallback(() => {
    setIsGlitching(true);

    // Quick burst of glitches
    let frame = 0;
    const maxFrames = intensity === "high" ? 6 : 4;

    const animate = () => {
      if (frame >= maxFrames) {
        setDisplay(text);
        setIsGlitching(false);
        return;
      }

      setDisplay(
        text
          .split("")
          .map((ch) => {
            if (ch === " ") return ch;
            return Math.random() < glitchRate
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : ch;
          })
          .join("")
      );

      frame++;
      setTimeout(animate, 60);
    };

    animate();
  }, [text, glitchRate, intensity]);

  useEffect(() => {
    const id = setInterval(doGlitch, interval);
    // Initial glitch on mount
    const timeout = setTimeout(doGlitch, 500);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [doGlitch, interval]);

  return (
    <span
      className={cn(className, isGlitching && "select-none")}
      aria-label={text}
    >
      {display}
    </span>
  );
}
