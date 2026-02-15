"use client";

import { useEffect, useRef, useCallback } from "react";
import { DECAY_CHARS } from "@/lib/decay/text-decay";

interface DecayBackgroundProps {
    /** Size of each grid cell in px */
    cellSize?: number;
    className?: string;
}

// Visible but subdued colors for the decayed characters
const DECAY_TEXT_COLORS = [
    "rgba(0, 255, 136, 0.18)",
    "rgba(0, 255, 136, 0.14)",
    "rgba(0, 212, 255, 0.12)",
    "rgba(255, 51, 68, 0.10)",
    "rgba(139, 92, 246, 0.10)",
    "rgba(255, 170, 0, 0.10)",
];

// Fast pseudo-random (seeded)
function seededRand(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
}

interface Cell {
    charIndex: number;
    nextCharSwap: number;
    textColor: string;
}

/**
 * Full-screen canvas ambient background of slowly cycling decay characters.
 * Renders the same DECAY_CHARS (░▒▓█╳╱╲…) used in gameplay, creating
 * visual cohesion between the menu and the decay engine.
 */
export function FireBarrier({
    cellSize = 14,
    className,
}: DecayBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const initAndAnimate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let cols = 0;
        let rows = 0;
        let cells: Cell[][] = [];

        function buildGrid() {
            const parent = canvas!.parentElement;
            const w = parent?.clientWidth ?? window.innerWidth;
            const h = parent?.clientHeight ?? window.innerHeight;
            canvas!.width = w;
            canvas!.height = h;

            cols = Math.ceil(w / cellSize);
            rows = Math.ceil(h / cellSize);

            cells = [];
            for (let r = 0; r < rows; r++) {
                const row: Cell[] = [];
                for (let c = 0; c < cols; c++) {
                    const seed = r * 1000 + c;
                    row.push({
                        charIndex: Math.floor(seededRand(seed * 13) * DECAY_CHARS.length),
                        nextCharSwap: seededRand(seed * 37) * 2000, // stagger initial swaps
                        textColor:
                            DECAY_TEXT_COLORS[
                            Math.floor(seededRand(seed * 19) * DECAY_TEXT_COLORS.length)
                            ]!,
                    });
                }
                cells.push(row);
            }
        }

        function animate(now: number) {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

            const fontSize = Math.max(cellSize - 2, 9);
            ctx!.font = `${fontSize}px "Space Mono", "JetBrains Mono", monospace`;
            ctx!.textAlign = "center";
            ctx!.textBaseline = "middle";

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = cells[r]![c]!;
                    const cx = c * cellSize + cellSize / 2;
                    const cy = r * cellSize + cellSize / 2;

                    // Cycle characters slowly
                    if (now > cell.nextCharSwap) {
                        cell.charIndex =
                            (cell.charIndex +
                                1 +
                                Math.floor(seededRand(now * 0.001 + r * c) * 3)) %
                            DECAY_CHARS.length;
                        cell.nextCharSwap = now + 600 + seededRand(r * 100 + c) * 2000;
                    }

                    const char = DECAY_CHARS[cell.charIndex]!;
                    ctx!.fillStyle = cell.textColor;
                    ctx!.fillText(char, cx, cy);
                }
            }

            animId = requestAnimationFrame(animate);
        }

        buildGrid();
        animId = requestAnimationFrame(animate);

        const onResize = () => buildGrid();
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", onResize);
        };
    }, [cellSize]);

    useEffect(() => {
        return initAndAnimate();
    }, [initAndAnimate]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
            aria-hidden="true"
        />
    );
}
