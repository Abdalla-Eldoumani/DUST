# CLAUDE.md — packages/backend (Convex Backend)

## What This Package Is

This is the **Convex real-time backend** for DUST. It handles:
- Game session persistence (save/resume games)
- Leaderboard (real-time global high scores)
- Archive storage (persist user archives across sessions)
- Content caching (pre-generated page content for reliability)
- User data (synced from Clerk auth)

## Why Convex

Convex gives us **real-time subscriptions for free** — the leaderboard updates live, game state syncs instantly, and we get a database + serverless functions with zero config. Perfect for a 24-hour hackathon.

## Key Commands

```bash
# From this directory:
npx convex dev          # Start Convex dev server (required during development)
npx convex deploy       # Deploy to production

# Environment setup:
npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-domain>
```

## Architecture

```
packages/backend/convex/
├── schema.ts           → Database schema (tables + indexes)
├── auth.config.ts      → Clerk authentication configuration
├── convex.config.ts    → Convex app configuration
├── gameSessions.ts     → Game session CRUD + queries
├── leaderboard.ts      → Leaderboard mutations + queries
├── archives.ts         → Archive persistence
├── cachedContent.ts    → Pre-generated content storage
├── users.ts            → User profile management (Clerk sync)
└── multiplayer.ts      → Multiplayer room management and actions
```

## Rules

1. **Keep it simple.** Convex functions should be thin — business logic lives in the frontend game engine.
2. **No over-indexing.** Only add database indexes we actually query on.
3. **Fail gracefully.** If Convex is down, the game should still work (just no leaderboard/persistence).
4. **Auth is required.** All game sessions and archive operations require an authenticated user.
5. **Don't over-normalize.** For a hackathon, denormalized data is fine. Store the full archive array in one document rather than individual items in a separate table.

## Environment Variables

Set via `npx convex env set`:
```
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

The Convex URL is automatically configured — no manual env var needed.
