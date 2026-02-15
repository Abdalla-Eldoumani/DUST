# CLAUDE.md — packages/env

## What This Is

Environment variable validation and typing using a shared schema. Ensures all required env vars are present and correctly typed at build time.

## Required Variables

```typescript
// Client-side (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_CONVEX_URL: string     // Convex deployment URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string  // Clerk publishable key

// Server-side only (NO NEXT_PUBLIC_ prefix)
CLERK_SECRET_KEY: string           // Clerk secret key
ANTHROPIC_API_KEY: string          // Claude API key — NEVER expose to client
```

## Rules

- **ANTHROPIC_API_KEY** must NEVER have `NEXT_PUBLIC_` prefix. It's server-side only.
- Update `src/web.ts` to validate all required variables for the web app.
- If a variable is missing, the build should fail with a clear error message.
- For development, values come from `apps/web/.env.local` (gitignored).
