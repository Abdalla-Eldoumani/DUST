"use client";

export function NoiseTexture() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[9998] h-full w-full opacity-[0.035]" aria-hidden="true">
      <filter id="dust-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#dust-noise)" />
    </svg>
  );
}
