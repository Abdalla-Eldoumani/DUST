# CLAUDE.md — apps/web/src

## Directory Layout

```
src/
├── app/           → Next.js App Router pages and API routes
├── components/    → All React components (game, UI, layout)
├── lib/           → Core logic: decay engine, content gen, types, utilities
├── store/         → Zustand state stores (game state, UI state)
├── index.css      → Global CSS: custom properties, base styles, effects
└── middleware.ts  → Clerk auth middleware configuration
```

## Architecture Rules

### Data Flow
```
User Input → Zustand Store (actions) → Component Re-render
                    ↓
            Decay Engine (lib/decay/) → Framer Motion Animations
                    ↓
            Convex Mutations (server actions) → Database
```

### Separation of Concerns
- **`lib/`** = Pure logic. No React dependencies (except custom hooks). Testable independently.
- **`store/`** = Zustand stores. Single source of truth for all state.
- **`components/`** = Presentation. Read from stores, render UI, delegate logic to lib/.
- **`app/`** = Page shells. Compose components, handle routing, define metadata.

### File Naming
- Components: `PascalCase` file names → `kebab-case.tsx` (e.g., `decay-timer.tsx` exports `DecayTimer`)
- Utilities: `kebab-case.ts` (e.g., `text-decay.ts`)
- Stores: `kebab-case.ts` with `use` prefix in export (e.g., `game-store.ts` exports `useGameStore`)
- Types: All shared types in `lib/types.ts`

### Import Aliases
Use `@/` alias for imports from `src/`:
```typescript
import { useGameStore } from "@/store/game-store";
import { DecayEngine } from "@/lib/decay/decay-engine";
import { Button } from "@/components/ui/button";
```

## Global Styles (index.css)

The `index.css` file must contain:
1. **CSS Custom Properties** — All colors, fonts, spacing from the design system
2. **Base Styles** — Default dark background, text color, font family
3. **Utility Classes** — `.scanline-overlay`, `.noise-texture`, `.glow-green`, `.glow-red`, `.glow-cyan`
4. **Animation Keyframes** — `@keyframes glitch`, `@keyframes flicker`, `@keyframes fadeDecay`
5. **Tailwind Directives** — `@tailwind base; @tailwind components; @tailwind utilities;`

## middleware.ts

Clerk auth middleware. Auth is required for all non-public routes:
- Public: `/`, `/sign-in`, `/sign-up`, `/about`, `/how-to-play`, `/api/generate-content`
- Protected (requires auth): `/play`, `/dashboard`, `/leaderboard`, `/multiplayer`, and all other routes
- Unauthenticated users are redirected to `/sign-in`
