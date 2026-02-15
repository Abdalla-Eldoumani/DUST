# CLAUDE.md — apps/web (Next.js Frontend)

## What This Directory Is

This is the **entire frontend** of DUST — the Next.js 15 application that runs the game. Everything the user sees and interacts with lives here.

## Tech Stack

- **Next.js 15** with App Router (`src/app/` for routes)
- **Tailwind CSS** for styling (configured in `postcss.config.mjs`)
- **shadcn/ui** components in `src/components/ui/`
- **Framer Motion** for all animations (especially decay effects)
- **Zustand** for game state management
- **Clerk** for authentication
- **Convex** client for backend communication

## Directory Structure

```
apps/web/src/
├── app/                 → Pages and routes (see app/CLAUDE.md)
├── components/          → All React components (see components/CLAUDE.md)
├── lib/                 → Utilities, hooks, game logic (see lib/CLAUDE.md)
├── store/               → Zustand state stores
├── index.css            → Global styles + CSS custom properties
└── middleware.ts        → Clerk auth middleware
```

## Key Commands

```bash
# From monorepo root:
npm run dev              # Starts Next.js dev server (via turborepo)

# From this directory:
npx next dev             # Direct Next.js dev
npx next build           # Production build (test before demo)
```

## Critical Rules

### Design
- **Dark theme ONLY.** No light mode. The `--bg-void` (#06060a) is the base.
- **Fonts:** Space Mono (display), Newsreader (fake content body), DM Sans (UI). NEVER Inter/Roboto.
- **No generic layouts.** The landing page should feel like a cinematic game menu. The game screen should feel immersive, not like a web app.
- **Scanline overlay** should be present on game screens (subtle CRT effect).

### Performance
- Decay animations MUST run at 60fps. Use `will-change`, `transform`, and `opacity` for GPU-accelerated properties. Avoid animating `width`, `height`, `top`, `left`.
- Use `React.memo` on components that re-render during the decay loop.
- Lazy-load the leaderboard and archive viewer pages with `next/dynamic`.

### Architecture
- All game logic lives in `src/lib/` — components are presentation-only.
- Game state is in Zustand (`src/store/`) — components read from store, dispatch actions.
- API calls (Claude, Convex) use server actions or API routes in `src/app/api/`.
- No direct Convex mutations from components — go through the store or server actions.

### Auth
- Clerk middleware protects only `/dashboard` and leaderboard submission.
- The game (`/play`) works WITHOUT authentication (guest mode).
- Never show a login wall before gameplay. Auth is optional and invisible.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=           # From Convex dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # From Clerk dashboard
CLERK_SECRET_KEY=                  # From Clerk dashboard
ANTHROPIC_API_KEY=                 # For Claude API (server-side only!)
```

**IMPORTANT:** `ANTHROPIC_API_KEY` must NOT have the `NEXT_PUBLIC_` prefix. It's server-side only.

## Testing Checklist

Before considering any page "done":
- [ ] Renders correctly at 1920x1080 (hackathon projector)
- [ ] Dark theme looks correct (no white flashes, no unstyled content)
- [ ] Animations are smooth (no jank on mid-range hardware)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors or warnings
