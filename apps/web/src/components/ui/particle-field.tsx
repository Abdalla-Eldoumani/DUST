"use client";

import { useEffect, useRef } from "react";

interface ParticleFieldProps {
  particleCount?: number;
  className?: string;
}

/**
 * Floating data-dust particles using canvas.
 * Subtle ambient effect for landing page and game background.
 */
export function ParticleField({
  particleCount = 60,
  className,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = [
      "rgba(0, 255, 136, OPACITY)",
      "rgba(0, 212, 255, OPACITY)",
      "rgba(139, 92, 246, OPACITY)",
      "rgba(255, 170, 0, OPACITY)",
    ];

    function resize() {
      width = canvas!.parentElement?.clientWidth ?? window.innerWidth;
      height = canvas!.parentElement?.clientHeight ?? window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }

    function init() {
      resize();
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        const opacity = 0.1 + Math.random() * 0.3;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.1 - Math.random() * 0.3, // drift upward
          size: 1 + Math.random() * 2,
          opacity,
          color: colors[Math.floor(Math.random() * colors.length)]!.replace(
            "OPACITY",
            opacity.toString()
          ),
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx!.fillStyle = p.color;
        ctx!.fillRect(p.x, p.y, p.size, p.size);
      }

      animId = requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
