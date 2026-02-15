# CLAUDE.md — apps/web/src/lib

## What This Directory Is

This is the **brain** of DUST. All game logic, the decay engine, content generation, types, and utilities live here. Components in `src/components/` are presentation-only — they read from stores and call functions defined here.

## Directory Structure

```
lib/
├── types.ts              → All TypeScript types/interfaces for the game
├── utils.ts              → General utility functions (cn, formatScore, etc.)
├── fonts.ts              → Google Font configurations for Next.js
├── constants.ts          → Game balance constants (decay rates, scoring values)
│
├── decay/                → The Decay Engine (HERO FEATURE)
│   ├── decay-engine.ts     → Main engine class: orchestrates all decay
│   ├── text-decay.ts       → Text corruption logic + React hook
│   ├── image-decay.ts      → Image degradation logic + React hook
│   ├── layout-decay.ts     → CSS/layout breakdown logic + React hook
│   └── color-decay.ts      → Color desaturation/shift logic
│
└── content/              → Content generation and management
    ├── generate-page.ts    → Claude API integration for page content
    ├── content-cache.ts    → Pre-generated fallback content
    ├── demo-content.ts     → Curated demo-specific content
    ├── difficulty.ts       → Difficulty scaling configuration
    └── prompts.ts          → Claude system prompts for content generation
```

## Types (types.ts)

Define these core types:

```typescript
// A single section of a fake web page
interface PageSection {
  id: string;                    // Unique ID for selection/archiving
  text: string;                  // The content text
  isTrue: boolean;               // Ground truth — is this factual?
  category: 'headline' | 'body' | 'quote' | 'statistic' | 'attribution' | 'metadata';
  decayOrder: number;            // 1 (decays first) to 5 (decays last)
  archiveCost: number;           // How much energy to archive this section
}

// Complete page content (returned by content generator)
interface PageContent {
  id: string;
  title: string;
  contentType: 'news' | 'blog' | 'social' | 'wiki';
  author: string;
  date: string;
  url: string;                   // Fake URL for the browser chrome
  sections: PageSection[];
  factCheckData: FactCheckData;
  difficulty: number;            // 1-10
  decayDuration: number;         // Seconds until full decay
}

// Data for fact-checking tools
interface FactCheckData {
  sourceCredibility: number;     // 0-100
  dateAccuracy: boolean;
  emotionalLanguageScore: number; // 0-100 (high = manipulative)
  crossReferenceHits: string[];  // Related "known facts"
  authorHistory: string;         // Brief author credibility note
}

// An item the player has archived
interface ArchivedItem {
  sectionId: string;
  sectionText: string;
  wasCorrect: boolean;           // Did they archive truth or misinfo?
  pointsEarned: number;
  level: number;
  timestamp: number;
}

// Game state phases
type GamePhase = 'menu' | 'loading' | 'playing' | 'analyzing' | 'archiving' | 'revealing' | 'results' | 'gameover';

// Final game results
interface GameResult {
  totalScore: number;
  accuracy: number;              // Percentage of correctly archived items
  pagesCompleted: number;
  totalArchived: number;
  bestCombo: number;
  timePlayed: number;            // Seconds
}
```

## Decay Engine (lib/decay/)

### Architecture

The decay engine is a state machine that drives visual corruption over time:

```
DecayEngine
  ├── progress: 0.0 → 1.0 (driven by requestAnimationFrame)
  ├── textDecay(text, progress) → corrupted string
  ├── imageDecay(progress) → CSS filter values
  ├── layoutDecay(progress) → CSS transform values
  └── colorDecay(progress) → CSS color values
```

### text-decay.ts

The text decay function takes original text and a progress value (0-1) and returns corrupted text:

```
Progress 0.0-0.2: No visible decay (text is readable)
Progress 0.2-0.4: Occasional character replacements (1 in 20 chars)
Progress 0.4-0.6: Increasing replacements (1 in 8 chars), some words fully garbled
Progress 0.6-0.8: Heavy corruption (1 in 3 chars), most words unreadable
Progress 0.8-1.0: Nearly complete corruption, only fragments visible
```

Replacement characters: `░ ▒ ▓ █ ╳ ╱ ╲ ◻ ◼ ▪ ▫ ◇ ◆ ● ○ ◌ ▢ ⌧ ⍜ ⎔`

The hook version (`useTextDecay`) takes text and decayProgress, returns the decayed string, memoized for performance.

**CRITICAL:** The decay must look INTENTIONAL and ARTISTIC, not like a broken webpage. Use monospace block characters that create a visual pattern, not random ASCII garbage.

### image-decay.ts

Progressive CSS filter chain:
```
Progress 0.0-0.3: brightness(1) contrast(1) saturate(1)
Progress 0.3-0.5: brightness(1.1) contrast(0.9) saturate(0.7) — fading
Progress 0.5-0.7: brightness(0.8) contrast(0.7) saturate(0.3) blur(1px) — degrading
Progress 0.7-0.9: brightness(0.5) contrast(0.5) saturate(0) blur(2px) — almost gone
Progress 0.9-1.0: opacity(0) — fully decayed
```

Also applies a pixelation effect via CSS `image-rendering: pixelated` combined with scaling tricks.

### layout-decay.ts

Progressive CSS transform disruption:
```
Progress 0.0-0.3: No transformation
Progress 0.3-0.5: Subtle skew (0.5deg), slight translate
Progress 0.5-0.7: Increased skew (1-2deg), opacity flickering
Progress 0.7-0.9: Major skew, sections drifting apart, heavy opacity reduction
Progress 0.9-1.0: Complete layout collapse
```

### decay-engine.ts

The main engine class:

```typescript
class DecayEngine {
  private progress: number = 0;
  private duration: number;        // Total decay time in seconds
  private startTime: number | null = null;
  private rafId: number | null = null;
  private listeners: Map<string, Function[]>;

  constructor(duration: number);

  start(): void;        // Begin the decay timer
  pause(): void;        // Pause (used when player is reading tools)
  resume(): void;       // Resume after pause
  reset(): void;        // Reset to 0
  getProgress(): number; // Current 0.0-1.0

  onMilestone(threshold: number, callback: () => void): void;
  // Fires callback when progress crosses threshold (0.25, 0.5, 0.75, 1.0)
}
```

## Content Generation (lib/content/)

### generate-page.ts

Server action that calls Claude API:

```typescript
'use server'

export async function generatePageContent(
  contentType: PageContent['contentType'],
  difficulty: number
): Promise<PageContent> {
  // 1. Call Claude API with system prompt from prompts.ts
  // 2. Parse structured JSON response
  // 3. Validate against PageContent type
  // 4. Return, or fall back to cached content on error
}
```

### prompts.ts

The Claude system prompt must instruct the model to:
1. Generate realistic web content of the specified type
2. Embed exactly 2-4 false claims (difficulty determines subtlety)
3. Return structured JSON with `isTrue` metadata per section
4. Include fact-check data (credibility, date accuracy, etc.)
5. Make the false claims BELIEVABLE — not obviously wrong
6. Vary topics across calls (politics, science, tech, culture, history)

### content-cache.ts

Pre-generated content for:
- Reliability (API might be slow/down during demo)
- Speed (no loading delay during gameplay)
- Consistency (demo always works the same way)

Export an array of 15+ `PageContent` objects covering:
- All 4 content types (news, blog, social, wiki)
- All difficulty levels (easy, medium, hard)
- Varied topics

### demo-content.ts

5 hand-curated pages specifically for the demo flow:
1. **Easy news article** — Obviously false statistic, slow decay. Shows the mechanic.
2. **Medium blog post** — Subtle unreliable narrator. Shows tools in action.
3. **Hard social thread** — Mixed true/false in same section. Creates tension.

These pages are chosen for VISUAL VARIETY and DEMO PACING — each one looks different and teaches a new aspect of the game.

## constants.ts

Game balance values — keep these in one place for easy tuning:

```typescript
export const GAME_CONSTANTS = {
  // Scoring
  CORRECT_ARCHIVE_POINTS: 100,
  MISINFO_ARCHIVE_PENALTY: -150,
  CLUTCH_SAVE_BONUS: 50,        // Archived in last 10% of decay
  COMBO_MULTIPLIER_INCREMENT: 0.25,  // Each consecutive correct +25%

  // Energy
  BASE_ARCHIVE_ENERGY: 5,
  ENERGY_REGEN_PER_LEVEL: 2,

  // Decay
  BASE_DECAY_DURATION: 60,       // Seconds for level 1
  DECAY_REDUCTION_PER_LEVEL: 5,  // Seconds faster per level
  MIN_DECAY_DURATION: 15,        // Never faster than 15s

  // Difficulty
  MAX_LEVEL: 10,
  MISINFO_SECTIONS_EASY: 1,     // Level 1-3
  MISINFO_SECTIONS_MEDIUM: 2,   // Level 4-6
  MISINFO_SECTIONS_HARD: 3,     // Level 7+
};
```
