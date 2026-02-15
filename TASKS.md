# DUST — Task Tracker

> **Instructions for Agents:** Check off tasks as you complete them by changing `[ ]` to `[x]`.
> Commit after completing each task group. Note any blockers or deviations inline.
> Tasks are ordered by priority within each phase. Complete them in order unless blocked.

---

## Phase 0: Environment & Scaffolding (Hour 0–1)

### 0.1 Project Setup
- [x] Install all dependencies: `npm install` from root
- [x] Install additional packages in `apps/web`:
  - `framer-motion` (decay animations)
  - `zustand` (game state)
  - `@ai-sdk/anthropic` or direct `@anthropic-ai/sdk` (Claude API)
  - `lucide-react` (icons)
  - `next-themes` (dark mode — default to dark)
  - `canvas-confetti` (victory effects)
- [x] Add Google Fonts to `apps/web/src/app/layout.tsx`:
  - `Space Mono` (display/monospace)
  - `Newsreader` (body/serif for fake web content)
  - `DM Sans` (UI elements)
- [x] Set up environment variables in `.env.local`:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `ANTHROPIC_API_KEY`
- [x] Verify Convex dev server runs: `npx convex dev` from `packages/backend`
- [x] Verify Next.js dev server runs: `npm run dev` from `apps/web`
- [x] Initial git commit: "Phase 0: Project scaffolding complete"

### 0.2 Design System Foundation
- [x] Create `apps/web/src/lib/fonts.ts` — export font configurations
- [x] Update `apps/web/src/index.css` with full CSS custom properties (see root CLAUDE.md color palette)
- [x] Create `apps/web/src/lib/cn.ts` — Tailwind merge utility (if not already in utils.ts)
- [x] Create `apps/web/src/components/ui/scanline-overlay.tsx` — CRT scanline effect component
- [x] Create `apps/web/src/components/ui/noise-texture.tsx` — background noise/grain overlay
- [x] Create `apps/web/src/components/ui/glow-text.tsx` — text with phosphor glow effect
- [x] Create `apps/web/src/components/ui/terminal-panel.tsx` — terminal-window styled container
- [x] Verify dark theme is default and looks correct
- [x] Git commit: "Phase 0: Design system foundation"

---

## Phase 1: Decay Engine — The Hero Feature (Hours 1–5)

### 1.1 Core Decay Animations
- [x] Create `apps/web/src/lib/decay/` directory
- [x] Create `apps/web/src/lib/decay/text-decay.ts`:
  - `useTextDecay(text, decayProgress)` hook
  - Characters replace with random glitch chars progressively
  - Supports configurable decay curve (linear, exponential, sigmoid)
  - Fine print decays first, headlines last
- [x] Create `apps/web/src/lib/decay/image-decay.ts`:
  - `useImageDecay(imageSrc, decayProgress)` hook
  - CSS filter chain: pixelate → desaturate → noise → fade
  - Uses canvas for pixelation effect at low performance cost
- [x] Create `apps/web/src/lib/decay/layout-decay.ts`:
  - `useLayoutDecay(decayProgress)` hook
  - CSS transforms that progressively break layout (skew, translate, opacity)
  - Grid/flex disruption effects
- [x] Create `apps/web/src/lib/decay/color-decay.ts`:
  - Progressive desaturation and hue shift
  - Colors bleed into adjacent elements at high decay
- [x] Git commit: "Phase 1.1: Core decay animation hooks"

### 1.2 Decay Engine Integration
- [x] Create `apps/web/src/lib/decay/decay-engine.ts`:
  - `useDecayEngine` hook that orchestrates all decay types
  - Takes a `duration` (seconds to full corruption) and manages progress
  - Exposes `progress` (0.0 to 1.0), `start()`, `pause()`, `resume()`, `reset()`
  - Milestone callbacks at configurable thresholds
- [x] Create `apps/web/src/components/game/decaying-page.tsx`:
  - Renders a full "web page" with all decay effects applied
  - Accepts `content` (page data) and `decayProgress` (0-1)
  - Sections decay at different rates (metadata first, headline last)
- [x] Create `apps/web/src/components/game/decay-timer.tsx`:
  - Visual timer showing remaining time before full decay
  - Progresses from green → amber → red
  - Pulses/glows when critical (< 25% remaining)
- [x] Created `apps/web/src/lib/types.ts` and `apps/web/src/lib/constants.ts`
- [x] Git commit: "Phase 1.2: Decay engine integration"

### 1.3 Fake Web Page Renderer
- [x] Create `apps/web/src/components/game/fake-page/` directory
- [x] Create `fake-page/news-article.tsx` — renders content as a news website
- [x] Create `fake-page/blog-post.tsx` — renders content as a personal blog
- [x] Create `fake-page/social-thread.tsx` — renders content as social media posts
- [x] Create `fake-page/wiki-article.tsx` — renders content as an encyclopedia entry
- [x] Each fake page type has its own visual style (fonts, layout, colors) that decays
- [x] Create `fake-page/page-chrome.tsx` — fake browser chrome (URL bar, tabs) wrapping the page
- [x] All fake pages use `Newsreader` font for body text (feels like real web content)
- [x] Git commit: "Phase 1.3: Fake web page renderer variants"

---

## Phase 2: Game Core (Hours 5–9)

### 2.1 Game State Management
- [x] Create `apps/web/src/store/game-store.ts` (Zustand):
  - `gamePhase`: 'menu' | 'playing' | 'analyzing' | 'scoring' | 'results' | 'gameover'
  - `currentLevel`: number (1-10+)
  - `score`: number
  - `combo`: number (consecutive correct archives)
  - `archiveEnergy`: number (how much the player can archive this round)
  - `maxArchiveEnergy`: number
  - `currentPage`: PageContent | null
  - `decayProgress`: number (0.0-1.0)
  - `archive`: ArchivedItem[] (what the player has saved)
  - `selectedSections`: string[] (sections marked for archiving this round)
  - Actions: `startGame()`, `nextPage()`, `selectSection()`, `archiveSelected()`, `revealResults()`, `resetGame()`
- [x] Create `apps/web/src/lib/types.ts`:
  - `PageContent` type (title, sections[], contentType, decayRate, metadata)
  - `PageSection` type (id, text, isTrue, category, decayOrder)
  - `ArchivedItem` type (section, wasCorrect, timestamp, level)
  - `GameResult` type (score, accuracy, archiveSize, timePlayed)
  - `FactCheckResult` type (credibility, flags, sources)
- [x] Git commit: "Phase 2.1: Game state management"

### 2.2 Content Generation
- [x] Create `apps/web/src/lib/content/generate-page.ts`:
  - Server action or API route that calls Claude API
  - System prompt that generates realistic web content with embedded misinfo
  - Returns structured `PageContent` with truth/false metadata per section
  - Handles API errors gracefully (fall back to cached content)
- [x] Create `apps/web/src/lib/content/content-cache.ts`:
  - 12 pre-generated pages stored as TypeScript (fallback content)
  - Load cached content when API is slow or unavailable
  - Variety across content types and difficulty levels
- [x] Create `apps/web/src/lib/content/difficulty.ts`:
  - Maps level number to decay rate, misinfo subtlety, and energy allocation
  - Level 1-3: Obvious misinfo, 60s decay, generous energy
  - Level 4-6: Subtle misinfo, 40s decay, moderate energy
  - Level 7-9: Very subtle misinfo, 25s decay, tight energy
  - Level 10+: Expert mode
- [x] Pre-generate and save 12 cached pages across all content types and difficulties
- [x] Git commit: "Phase 2.2: Content generation system"

### 2.3 Fact-Check Tools UI
- [x] Create `apps/web/src/components/game/tools/` directory
- [x] Create `tools/tool-panel.tsx`:
  - Collapsible side panel with fact-checking tools
  - Terminal-panel aesthetic (see design system)
  - Tools cost "analysis time" to use (adds strategic depth)
- [x] Create `tools/source-scanner.tsx`:
  - Shows author/publication credibility score
  - Visual meter (green to red) with explanation
- [x] Create `tools/date-checker.tsx`:
  - Flags anachronistic or suspicious dates
  - Highlights inconsistencies with visual markers
- [x] Create `tools/cross-reference.tsx`:
  - Compares claims against "known facts" — shows matches/conflicts
  - Results appear as a mini truth-table
- [x] Create `tools/sentiment-analyzer.tsx`:
  - Flags emotionally manipulative language
  - Highlights charged words/phrases with colored underlines
- [x] All tools animate their results in with Framer Motion
- [x] Git commit: "Phase 2.3: Fact-check tools"

### 2.4 Archive Interaction
- [x] Create `apps/web/src/components/game/archive/` directory
- [x] Create archive interaction via DecayingPage section click handler
- [x] Create `archive/archive-button.tsx`:
  - Big "ARCHIVE" button — commits selected sections
  - Disabled when no sections selected or no energy remaining
  - Satisfying animation on press (pulse, glow)
- [x] Create `archive/energy-bar.tsx`:
  - Visual bar showing remaining archive energy
  - Depletes as sections are selected
  - Color-coded (green → amber → red as energy drops)
- [x] Git commit: "Phase 2.4: Archive interaction system"

### 2.5 Scoring & Results
- [x] Create `apps/web/src/components/game/scoring/` directory
- [x] Create `scoring/reveal-screen.tsx`:
  - After archiving, reveals which sections were true vs. false
  - Dramatic reveal animation (sections flash green/red)
  - Score breakdown: base points, combo bonus, clutch save bonus
- [x] Create `scoring/score-display.tsx`:
  - Persistent score display during gameplay
  - Animates when score changes (count-up effect)
  - Shows combo multiplier with glow effect
- [x] Create `scoring/game-over-screen.tsx`:
  - Final results after all lives lost or all levels complete
  - Stats: total score, accuracy %, pages archived, best combo
  - "Submit to Leaderboard" button
  - "Play Again" and "View Archive" buttons
  - Visually impressive — this is what judges see at the end of the demo
- [x] Git commit: "Phase 2.5: Scoring and results"

---

## Phase 3: Backend Integration (Hours 9–12)

### 3.1 Convex Schema & Functions
- [ ] Update `packages/backend/convex/schema.ts`:
  - `gameSessions` table: userId, score, level, status, startedAt, endedAt
  - `archives` table: userId, sessionId, items[], totalScore, accuracy
  - `leaderboard` table: userId, username, avatar, score, accuracy, level, date
  - `cachedContent` table: content, contentType, difficulty, createdAt
- [ ] Create `packages/backend/convex/gameSessions.ts`:
  - `create` mutation — start a new game session
  - `update` mutation — update score/level during game
  - `finish` mutation — end session, compute final stats
  - `getActive` query — get user's active session
- [ ] Create `packages/backend/convex/leaderboard.ts`:
  - `submit` mutation — add score to leaderboard
  - `getTop` query — top 100 scores (paginated)
  - `getUserRank` query — current user's position
- [ ] Create `packages/backend/convex/archives.ts`:
  - `save` mutation — persist user's archive
  - `getUserArchive` query — retrieve full archive for viewer
- [ ] Git commit: "Phase 3.1: Convex schema and functions"

### 3.2 Auth Integration
- [ ] Verify Clerk provider is configured in `apps/web/src/components/providers.tsx`
- [ ] Verify Convex auth is connected to Clerk in `packages/backend/convex/auth.config.ts`
- [ ] Add guest mode: allow playing without login (but can't save to leaderboard)
- [ ] Create sign-in redirect: after login, redirect back to game
- [ ] Auth should be INVISIBLE in demo flow — no login screens, no barriers
- [ ] Git commit: "Phase 3.2: Auth integration"

### 3.3 Leaderboard Page
- [ ] Create `apps/web/src/app/leaderboard/page.tsx`:
  - Terminal-styled leaderboard display
  - Top 10 with rank, username, score, accuracy, date
  - Current user highlighted if on board
  - Real-time updates via Convex subscriptions
  - Responsive (looks good on projector for demo)
- [ ] Git commit: "Phase 3.3: Leaderboard page"

---

## Phase 4: Visual Polish & Pages (Hours 12–16)

### 4.1 Landing Page
- [x] Redesign `apps/web/src/app/page.tsx`:
  - CINEMATIC landing page — this is the first thing judges see
  - Animated title "DUST" with glitch/decay effect on load
  - Tagline animates in: "The internet is dying. You're the last archivist."
  - Dark, atmospheric background with floating particle effects (data dust)
  - Subtle CRT scanline overlay
  - Big "PLAY" button with glow effect
  - Secondary links: Leaderboard, How to Play, About
  - NO generic hero section. NO stock imagery. NO typical landing page layout.
  - Think: the opening screen of a cinematic indie game
- [x] Created `glitch-text.tsx` and `particle-field.tsx` components
- [x] Git commit: "Phase 4.1: Landing page"

### 4.2 Game Screen Layout
- [x] Create `apps/web/src/app/play/page.tsx`:
  - Main game screen layout with full game loop
  - Left: Fake page viewport (70% width) with decay
  - Right: Tool panel + archive controls (30% width)
  - Top: Score bar, level indicator, decay timer
  - Bottom: Page counter, difficulty label
  - Menu state, loading, gameplay, reveal, game over states
- [x] Create `apps/web/src/app/play/layout.tsx`:
  - Game-specific layout (no header nav, minimal chrome)
  - Full-screen immersive experience with scanline overlay
- [x] Git commit: "Phase 4.2: Game screen layout"

### 4.3 How to Play / Tutorial
- [ ] Create `apps/web/src/app/how-to-play/page.tsx`:
  - Interactive tutorial with 3-4 steps
  - Step 1: "Pages appear and start decaying" (show mini decay demo)
  - Step 2: "Use tools to fact-check content" (highlight tools)
  - Step 3: "Select and archive the truth" (show selection mechanic)
  - Step 4: "Build the most accurate archive" (show scoring)
  - Quick to read (< 60 seconds) — judges don't have patience for long tutorials
- [ ] Git commit: "Phase 4.3: Tutorial page"

### 4.4 Visual Polish Pass
- [ ] Add page transition animations (Framer Motion `AnimatePresence`)
- [ ] Add loading states with custom skeleton screens (decaying skeleton, not just gray boxes)
- [ ] Add hover effects on all interactive elements
- [ ] Add sound effects (optional, only if time permits):
  - Ambient hum for game screen
  - Glitch/static sound on decay milestones
  - Archive confirmation sound
  - Score count-up ticking
- [ ] Ensure all text is readable during mid-decay (not just early/late)
- [ ] Add "screen shake" effect when decay hits critical threshold
- [ ] Add particle effects (floating data dust) on game screen background
- [ ] Test on 1920x1080 (projector resolution for demo)
- [ ] Git commit: "Phase 4.4: Visual polish"

### 4.5 About Page
- [ ] Create `apps/web/src/app/about/page.tsx`:
  - Brief project description (ties to all 3 hackathon topics)
  - Team credits (name + role for all 4 members)
  - Tech stack overview
  - Link to GitHub repo
  - Styled consistently with rest of app
- [ ] Git commit: "Phase 4.5: About page"

---

## Phase 5: Demo Prep & Hardening (Hours 16–20)

### 5.1 Demo Flow Optimization
- [ ] Create `apps/web/src/lib/content/demo-content.ts`:
  - 5 hand-curated pages specifically designed for the 3-minute demo
  - Page 1: Easy (obvious fake, slow decay) — shows mechanics
  - Page 2: Medium (subtle misinfo, teaches tools)
  - Page 3: Hard (clutch save, fast decay) — creates tension
  - Each page chosen for visual variety (news, blog, social, wiki)
- [ ] Add "Demo Mode" flag in game store:
  - Uses curated content instead of AI-generated
  - Skips any loading delays
  - Consistent experience every time
- [ ] Pre-generate and cache all demo content in Convex
- [ ] Test the full demo flow 5 times end-to-end
- [ ] Git commit: "Phase 5.1: Demo flow optimization"

### 5.2 Error Handling & Resilience
- [ ] Add error boundaries around game components
- [ ] Handle Claude API failures gracefully (fall back to cached content)
- [ ] Handle Convex connection issues (queue locally, sync later)
- [ ] Handle Clerk auth failures (allow guest play)
- [ ] Test with network throttling (slow 3G) — game should still be playable
- [ ] Git commit: "Phase 5.2: Error handling"

### 5.3 Performance Optimization
- [ ] Profile decay animations — ensure 60fps on mid-range hardware
- [ ] Lazy-load non-critical components (leaderboard, archive viewer)
- [ ] Optimize images (if any) with Next.js Image component
- [ ] Test on Chrome and Firefox (the two browsers most likely at the hackathon)
- [ ] Git commit: "Phase 5.3: Performance optimization"

### 5.4 Devpost & Pitch Assets
- [ ] Take 3-5 high-quality screenshots of the game at key moments
- [ ] Record a 30-second backup demo video (screen recording)
- [ ] Write Devpost description (see root CLAUDE.md for structure)
- [ ] Prepare 3-minute demo script:
  - 0:00-0:15 — Problem statement (info is ephemeral, truth is fragile)
  - 0:15-2:15 — Live gameplay demo (3 pages, showing mechanics)
  - 2:15-3:00 — Impact + vision + topic alignment
- [ ] Git commit: "Phase 5.4: Demo assets"

### 5.5 Final Checks
- [ ] All pages render correctly on 1920x1080
- [ ] Dark mode is default and only mode (no light mode toggle needed)
- [ ] No console errors or warnings
- [ ] Leaderboard populates correctly
- [ ] Guest mode works without Clerk login
- [ ] "DUST" title and branding is consistent everywhere
- [ ] Git commit: "Phase 5.5: Final checks — ship it 🚀"

---

## Stretch Goals (Only if ahead of schedule)

- [ ] Multiplayer race mode (two players competing on same page)
- [ ] Screen recording/replay of best moments
- [ ] Daily challenge mode (same content for all players)
- [ ] Achievement badges (First Archive, Speed Demon, Perfect Score)
- [ ] PWA support (installable web app)
- [ ] Sound design with Web Audio API
- [ ] Animated tutorial instead of static how-to-play page