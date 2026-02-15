# DUST — Digital Archaeologist Game

## 🏆 Project Overview

**DUST** is our Calgary Hacks 2026 submission — a web game where you play as a digital archaeologist racing to save a decaying internet. Websites visually corrupt in real-time (text garbles, images pixelate, layouts shatter). You must critically evaluate content for misinformation, then archive the truth before it's lost forever.

**One-Line Pitch:** "The internet is dying. You're the last archivist. Save what matters — but archive a lie, and you pollute history."

### Hackathon Topic Fusion

| Topic | How DUST Addresses It |
|-------|----------------------|
| **Critical Thinking** | Players evaluate sources, spot misinformation, cross-reference claims, and make evidence-based archive decisions under time pressure |
| **Archives / Preservation** | The entire gameplay loop IS digital preservation — players build a curated archive from a crumbling web |
| **Game: "Impermanence"** | Content visually decays in real-time as the core mechanic. Unarchived pages are lost forever. Impermanence isn't just a theme — it's the engine |

---

## 🏗️ Architecture

### Monorepo Structure (Turborepo)

```
DUST/
├── apps/web/              → Next.js 15 frontend (game + UI)
├── packages/backend/      → Convex real-time backend
├── packages/config/       → Shared TypeScript config
├── packages/env/          → Environment variable validation
├── TASKS.md               → Living task tracker (agents update this)
├── CLAUDE.md              → This file (you are here)
└── .claude/settings.json  → Claude Code agent configuration
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router) | Fast SSR, file-based routing, our team's core competency |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid professional UI with deep customization |
| **Animation** | Framer Motion | The decay engine — our entire visual identity depends on this |
| **State** | Zustand | Lightweight game state management, no boilerplate |
| **Backend** | Convex | Real-time database with zero-config, perfect for leaderboards and game sessions |
| **Auth** | Clerk | Pre-built auth, zero time wasted on login flows |
| **AI** | Anthropic Claude API | Generates realistic web page content with embedded misinformation |
| **Fonts** | Custom Google Fonts | NOT Inter/Roboto — see design system below |
| **Deploy** | Vercel | Instant deploys, free tier, custom domain |

### Data Flow

```
User Action → Zustand (game state) → UI Re-render (with Framer Motion decay)
                                    ↓
                              Archive Decision → Convex (persist score, archive, leaderboard)
                                    ↓
                              Claude API (generate next page content)
```

---

## 🎨 Design System — "Digital Archaeology"

### THIS IS CRITICAL. READ CAREFULLY.

The design MUST feel like exploring an abandoned digital world. Think: a terminal in a post-apocalyptic server room, mixed with the eerie beauty of data degrading. **NOT generic AI-generated UI. NOT purple gradients on white. NOT Inter font with rounded cards.**

### Color Palette

```css
:root {
  /* Backgrounds — deep, dark, layered */
  --bg-void: #06060a;        /* Deepest background */
  --bg-primary: #0a0e17;     /* Main background */
  --bg-surface: #111827;     /* Card/panel surfaces */
  --bg-elevated: #1a2332;    /* Elevated elements */

  /* Accent Colors — phosphorescent, digital */
  --accent-archive: #00ff88;  /* Green — archive/save actions */
  --accent-decay: #ff3344;    /* Red — decay/danger/misinformation */
  --accent-scan: #00d4ff;     /* Cyan — scanning/analysis tools */
  --accent-amber: #ffaa00;    /* Amber — warnings, time pressure */
  --accent-ghost: #8b5cf6;    /* Purple — ghost data, fading content */

  /* Text */
  --text-primary: #e2e8f0;   /* Primary readable text */
  --text-secondary: #94a3b8; /* Secondary/muted text */
  --text-ghost: #475569;     /* Nearly faded text */

  /* Effects */
  --glow-green: 0 0 20px rgba(0, 255, 136, 0.3);
  --glow-red: 0 0 20px rgba(255, 51, 68, 0.3);
  --glow-cyan: 0 0 20px rgba(0, 212, 255, 0.3);
  --scanline: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
}
```

### Typography

```
Display / Headers: "Space Mono" (monospace, techy, archival feel)
  - Alternatively: "JetBrains Mono", "IBM Plex Mono"
  - Use for: game titles, scores, timestamps, terminal-style elements

Body / Readable: "Newsreader" (serif, editorial, web-content feel)
  - Alternatively: "Lora", "Source Serif 4"
  - Use for: the fake web pages being archived (makes them feel like real articles)

UI Elements: "Geist Sans" or "DM Sans" (clean, modern)
  - Use for: buttons, labels, navigation, tool interfaces
```

### Visual Effects (Non-Negotiable)

1. **CRT Scan Lines** — Subtle overlay on the entire game viewport via CSS `::after` pseudo-element
2. **Glitch Transitions** — When navigating between pages, use CSS `clip-path` glitch effects
3. **Phosphor Glow** — Text and borders glow subtly, like old CRT monitors
4. **Noise Texture** — Subtle grain overlay on backgrounds (CSS or SVG filter)
5. **Grid Overlay** — Faint dot or line grid on backgrounds, like graph paper or a data grid
6. **Decay Particles** — Small floating particles (CSS or canvas) that drift across the screen, representing data loss

### Layout Principles

- **Asymmetric layouts** — Don't center everything. Use off-grid positioning for the game UI.
- **Terminal-inspired panels** — UI panels should look like terminal windows (title bar with dots, monospace headers)
- **Data visualization accents** — Small decorative charts, hex dumps, binary strings as texture
- **Generous dark space** — Let the dark background breathe. Density where gameplay happens, void elsewhere.
- **NO rounded-everything** — Mix sharp corners (terminal panels) with selective rounding (buttons, badges)

---

## 🎮 Game Design Document

### Core Loop

```
1. EXPLORE  → A new "webpage" appears (AI-generated, realistic-looking)
2. DECAY    → The page starts visually corrupting (text scrambles, images degrade)
3. ANALYZE  → Player uses fact-checking tools to evaluate content
4. DECIDE   → Player selects sections to archive (limited "archive energy")
5. SCORE    → Reveal what was true vs. fake. Points for truth, penalties for misinfo.
6. PROGRESS → Next page loads. Difficulty increases (faster decay, subtler misinfo).
```

### Game Mechanics

**Decay System:**
- Each page has a `decayRate` (seconds until fully corrupted)
- Decay is VISUAL, not instant — text scrambles letter-by-letter, images pixelate progressively
- Decay speeds up as levels progress (Level 1: 60s, Level 5: 30s, Level 10: 15s)
- Different content types decay differently (headlines last longest, fine print goes first)

**Archive Energy:**
- Players have limited "archive energy" per page (can't save everything)
- Energy refills partially between pages
- Forces triage decisions: "What's most important to preserve?"

**Fact-Check Tools:**
- **Source Scanner** — Shows credibility indicators for the "author" / "publication"
- **Date Checker** — Flags anachronistic dates or impossible timelines
- **Cross-Reference** — Compares claims against a "known facts" database
- **Sentiment Analyzer** — Flags emotionally manipulative language

**Scoring:**
- +100 points for archiving verified true content
- -150 points for archiving misinformation (harsh penalty — makes you think twice)
- +50 bonus for archiving content just before it fully decays (clutch save)
- Combo multiplier for consecutive correct archives
- Final score = archive quality × completeness × speed bonus

**Difficulty Progression:**
- Levels 1-3: Obvious misinformation, slow decay, generous energy
- Levels 4-6: Subtle misinformation, medium decay, moderate energy
- Levels 7-9: Very subtle misinfo (mixed truth/lies in same paragraph), fast decay
- Level 10+: "Expert mode" — near-invisible misinfo, rapid decay, minimal energy

### Content Types (AI-Generated)

Each "page" is one of these content types, themed to feel like a real website:
1. **News Article** — Breaking news with embedded false claims
2. **Blog Post** — Personal narrative with unreliable narrator elements
3. **Social Media Thread** — Chain of posts with misinformation spreading
4. **Wiki Article** — Encyclopedia-style with subtle factual errors
5. **Government Document** — Official-looking with redactions and alterations
6. **Scientific Abstract** — Technical content with methodological flaws

---

## 🔌 API Integration

### Claude API Usage

We call Claude to generate page content. The system prompt ensures:
- A mix of true and false claims in every page
- Metadata tagging (which sentences are true, which are false) for scoring
- Content that LOOKS realistic and requires careful reading to evaluate
- Variety across content types and topics

**IMPORTANT:** Pre-generate 10-15 pages before the demo to avoid API latency during live gameplay. Cache them in Convex. Fall back to cached content if API is slow.

### Convex Backend

**Tables:**
- `gameSessions` — Active game state, score, current level
- `archives` — Saved content items per user
- `leaderboard` — Global high scores
- `cachedContent` — Pre-generated page content from Claude API
- `users` — Clerk-synced user profiles

---

## 📁 Directory-Specific CLAUDE.md Files

Every subdirectory has its own CLAUDE.md with specific instructions for that area. Read them before working in that directory.

---

## ⚠️ Critical Rules for All Agents

1. **NEVER** add a login screen to the demo flow. Use Clerk's pre-built components, tucked away.
2. **NEVER** use Inter, Roboto, Arial, or system-ui fonts. Follow the typography guide above.
3. **NEVER** use generic purple/blue gradients on white backgrounds. Follow the color palette.
4. **NEVER** over-engineer the backend. Convex handles real-time — don't add unnecessary abstraction.
5. **ALWAYS** test the decay animations at multiple speeds before considering them done.
6. **ALWAYS** commit to git after completing each task in TASKS.md.
7. **ALWAYS** update TASKS.md checkboxes as you complete work.
8. **ALWAYS** prioritize visual polish over feature count. A beautiful 5-feature game beats an ugly 15-feature game.
9. **DESIGN** like a human designer, not an AI. Asymmetry. Tension. Surprise. Character.
10. **REMEMBER:** "If it's not in the demo, it doesn't exist."

---

## 🚀 Build Order (Read TASKS.md for details)

```
Phase 0: Environment & Scaffolding (Hour 0-1)
Phase 1: Decay Engine — the "hero" feature (Hours 1-5)
Phase 2: Game Core — content, fact-checking, archive (Hours 5-9)
Phase 3: Backend Integration — Convex, auth, leaderboard (Hours 9-12)
Phase 4: Visual Polish — animations, effects, sound (Hours 12-16)
Phase 5: Demo & Pitch Prep (Hours 16-20)
```