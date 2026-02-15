# CLAUDE.md — apps/web/src/app (Pages & Routes)

## Route Map

```
/                    → Landing page (cinematic game menu)
/play                → Main game screen (the gameplay experience)
/play/results        → End-of-game results (or handle as modal/overlay in /play)
/leaderboard         → Global leaderboard
/how-to-play         → Interactive tutorial (3-4 quick steps)
/about               → Project info, team credits, tech stack
/dashboard           → User profile/stats (Clerk-protected, low priority)
/api/generate-content → API route for Claude content generation (server-side)
```

## Page Design Specifications

### `/` — Landing Page
**This is the MOST IMPORTANT page for first impressions.**

Design brief:
- Full-screen dark viewport with NO traditional nav bar
- "DUST" title: massive, monospace (Space Mono), with a real-time glitch/decay animation that plays on loop
- Tagline: "The internet is dying. You're the last archivist." — fades in letter by letter
- Background: deep void (#06060a) with floating particle effects (tiny dots drifting like data dust)
- CRT scanline overlay (subtle, atmospheric)
- Large "PLAY" button center-bottom: glowing green border, phosphor glow on hover
- Smaller links below: "How to Play" | "Leaderboard" | "About"
- NO hero images. NO stock photos. NO typical SaaS landing page patterns.
- Feel: the menu screen of an atmospheric indie game (think: Limbo, Inside, Return of the Obra Dinn)
- Framer Motion: stagger animations on mount — title first, tagline second, button third

### `/play` — Game Screen
**This is the MOST IMPORTANT page for gameplay demo.**

Layout (desktop):
```
┌─────────────────────────────────────────────────────────┐
│  Score: 1,250  │  Level 3  │  ████████░░ Decay Timer    │  ← Top bar
├───────────────────────────────────┬─────────────────────┤
│                                   │  TOOLS              │
│   ┌─────────────────────────┐     │  ┌───────────────┐  │
│   │                         │     │  │Source Scanner │  │
│   │   FAKE WEB PAGE         │     │  │Date Checker   │  │
│   │   (with decay effects)  │     │  │Cross-Reference│  │
│   │                         │     │  │Sentiment      │  │
│   │   Click sections to     │     │  └───────────────┘  │
│   │   mark for archiving    │     │                     │
│   │                         │     │  ARCHIVE            │
│   └─────────────────────────┘     │  Energy: ████░░     │
│                                   │  [ARCHIVE SELECTED] │
├───────────────────────────────────┴─────────────────────┤
│  Archive Energy: ████████████░░░░  │  Hint: Check dates │  ← Bottom bar
└─────────────────────────────────────────────────────────┘
```

- The fake page viewport takes ~65-70% width
- Tool panel takes ~30-35% width
- Top bar: score (left), level (center), decay timer (right)
- Bottom bar: energy bar (left), contextual hint (right)
- The page is wrapped in a "browser chrome" component (fake URL bar, tabs)
- On mobile: tool panel slides up from bottom as a drawer

### `/leaderboard` — Leaderboard
- Terminal-styled table (monospace font, green-on-dark aesthetic)
- Columns: Rank | Username | Score | Accuracy | Level | Date
- Top 3 get special visual treatment (gold/silver/bronze glow)
- Current user's row highlighted if they're on the board
- Real-time updates via Convex subscription
- Should look INCREDIBLE on a projector (big text, high contrast)

### `/how-to-play` — Tutorial
- 3-4 step carousel or scroll-through
- Each step has a mini interactive demo or animation (not just text)
- Step 1: Show a page decaying (mini decay demo)
- Step 2: Show tools being used (highlight panel)
- Step 3: Show section selection and archiving
- Step 4: Show scoring reveal
- Keep it under 60 seconds to read/interact with
- "Start Playing" CTA at the end

### `/about` — About Page
- Project description: what DUST is and why it matters
- Explicit topic mapping (Critical Thinking, Archives, Impermanence)
- Team credits with names and roles
- Tech stack (with logos if time permits)
- GitHub link
- Styled consistently with rest of the app (dark, terminal-influenced)

### `/api/generate-content` — Content Generation API Route

This is a Next.js API route (Route Handler) that:
1. Accepts POST with `{ contentType, difficulty }` 
2. Calls Claude API with a system prompt that generates fake web page content
3. Returns structured `PageContent` JSON with truth/false metadata
4. Has rate limiting (1 call per 5 seconds max)
5. Falls back to cached content on API failure

**Claude System Prompt must produce:**
```json
{
  "title": "string",
  "contentType": "news|blog|social|wiki",
  "author": "string",
  "date": "string",
  "sections": [
    {
      "id": "string",
      "text": "string",
      "isTrue": true/false,
      "category": "headline|body|quote|statistic|attribution",
      "decayOrder": 1-5 (1 = decays first, 5 = decays last)
    }
  ],
  "factCheckData": {
    "sourceCredibility": 0-100,
    "dateAccuracy": true/false,
    "emotionalLanguageScore": 0-100,
    "crossReferenceHits": ["string"]
  }
}
```

## Layout Configuration

### `layout.tsx` (Root)
- HTML `<html>` with `dark` class, `lang="en"`
- Google Fonts loaded via `next/font/google`: Space Mono, Newsreader, DM Sans
- Providers: ClerkProvider, ConvexProvider, ThemeProvider
- NO global header/nav on game pages — use conditional rendering based on route
- Global metadata: title "DUST", description, OG image

### `/play/layout.tsx` (Game-specific)
- Full-screen layout with no header/footer
- Scanline overlay applied to entire viewport
- Game-specific keyboard listeners (if any)
- Prevents scroll bounce on mobile
