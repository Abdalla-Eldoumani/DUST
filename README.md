# DUST

A web game built for Calgary Hacks 2026. You play as a digital archaeologist racing to save a decaying internet. Websites visually corrupt in real-time — text garbles, images pixelate, layouts shatter. Your job is to evaluate content for misinformation and archive the truth before it's lost.

The internet is dying. You're the last archivist. Save what matters — but archive a lie, and you pollute history.

## How It Works

Each round, you're shown a fake web page (news article, blog post, social media thread, or wiki entry) that looks realistic but contains a mix of true and false claims. The page decays over time — characters scramble, the layout breaks apart. You use fact-checking tools to analyze the content, select the sections you believe are true, and archive them before the page is gone. Correct archives earn points; archiving misinformation costs you.

The game has three modes:

- **Solo** — Play through increasingly difficult pages on your own
- **Race** — Head-to-head against another player, same page, first to archive gets a speed bonus
- **Co-op** — Work together with shared energy and a combined score

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| State | Zustand |
| Backend | Convex (real-time database) |
| Auth | Clerk |
| AI | Anthropic Claude API (content generation) |
| Monorepo | Turborepo |

## Project Structure

```
DUST/
├── apps/web/              Next.js frontend (game + UI)
│   └── src/
│       ├── app/           Pages: /, /play, /leaderboard, /multiplayer, /sign-in, etc.
│       ├── components/    React components (game, UI, leaderboard, multiplayer)
│       ├── lib/           Game logic, decay engine, content generation, types
│       └── store/         Zustand stores (game state, multiplayer state)
├── packages/backend/      Convex backend
│   └── convex/            Schema, mutations, queries (gameSessions, leaderboard,
│                          users, archives, multiplayer, cachedContent)
├── packages/config/       Shared TypeScript config
└── packages/env/          Environment variable validation
```

## Getting Started

Install dependencies:

```bash
npm install
```

Set up Convex:

```bash
npm run dev:setup
```

Follow the prompts to create a Convex project. Copy environment variables from `packages/backend/.env.local` to `apps/web/.env`.

### Environment Variables

You need these in `apps/web/.env`:

```
NEXT_PUBLIC_CONVEX_URL=           # From Convex dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # From Clerk dashboard
CLERK_SECRET_KEY=                  # From Clerk dashboard
ANTHROPIC_API_KEY=                 # For Claude API (server-side only)
```

And set this in the Convex dashboard:

```
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

Clerk setup guide: [Convex + Clerk](https://docs.convex.dev/auth/clerk)

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Routes

| Path | What It Does |
|------|-------------|
| `/` | Landing page |
| `/play` | Solo game (requires sign-in) |
| `/multiplayer` | Create or join a multiplayer room |
| `/multiplayer/[code]` | Active multiplayer room |
| `/leaderboard` | Global high scores (real-time via Convex) |
| `/how-to-play` | Tutorial |
| `/about` | Project info and credits |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

All routes except `/`, `/about`, `/how-to-play`, and the sign-in/up pages require authentication.

## Available Scripts

- `npm run dev` — Start everything in dev mode
- `npm run build` — Production build
- `npm run dev:web` — Start only the frontend
- `npm run dev:setup` — Set up Convex project
- `npm run check-types` — TypeScript check across all packages

## Hackathon Topics

| Topic | How DUST Addresses It |
|-------|----------------------|
| Critical Thinking | Players evaluate sources, spot misinformation, and make evidence-based archive decisions under time pressure |
| Archives / Preservation | The entire gameplay loop is digital preservation — players build a curated archive from a crumbling web |
| "Impermanence" | Content visually decays in real-time. Unarchived pages are lost forever. Impermanence is the core mechanic |

## Team

Calgary Hacks 2026 submission.
