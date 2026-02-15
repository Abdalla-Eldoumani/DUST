"use client";

import Link from "next/link";
import { UserMenu } from "./user-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/how-to-play", label: "How to Play" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/multiplayer", label: "Multiplayer" },
  { to: "/about", label: "About" },
] as const;

export default function Header() {
  return (
    <div className="border-b border-white/10 bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-mono text-lg font-bold tracking-widest text-archive"
          >
            DUST
          </Link>
          <nav className="flex items-center gap-4">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className="font-sans text-sm text-text-ghost transition-colors hover:text-text-secondary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <UserMenu />
      </div>
    </div>
  );
}
