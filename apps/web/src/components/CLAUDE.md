# CLAUDE.md — apps/web/src/components

## Component Organization

```
components/
├── ui/                    → shadcn/ui base components + custom design system components
│   ├── button.tsx          (existing shadcn)
│   ├── card.tsx            (existing shadcn)
│   ├── ...                 (other shadcn components)
│   ├── scanline-overlay.tsx  (custom: CRT scanline effect)
│   ├── noise-texture.tsx     (custom: background grain)
│   ├── glow-text.tsx         (custom: phosphor glow text)
│   ├── terminal-panel.tsx    (custom: terminal-window container)
│   ├── particle-field.tsx    (custom: floating data dust particles)
│   └── glitch-text.tsx       (custom: text with glitch animation)
│
├── game/                  → Game-specific components
│   ├── decaying-page.tsx    (the main decaying web page renderer)
│   ├── decay-timer.tsx      (visual countdown timer)
│   ├── fake-page/           (fake web page type renderers)
│   │   ├── news-article.tsx
│   │   ├── blog-post.tsx
│   │   ├── social-thread.tsx
│   │   ├── wiki-article.tsx
│   │   └── page-chrome.tsx  (fake browser chrome wrapper)
│   ├── tools/               (fact-checking tool components)
│   │   ├── tool-panel.tsx
│   │   ├── source-scanner.tsx
│   │   ├── date-checker.tsx
│   │   ├── cross-reference.tsx
│   │   └── sentiment-analyzer.tsx
│   ├── archive/             (archive interaction components)
│   │   ├── section-selector.tsx
│   │   ├── archive-button.tsx
│   │   ├── energy-bar.tsx
│   │   └── archive-viewer.tsx
│   └── scoring/             (scoring and results components)
│       ├── reveal-screen.tsx
│       ├── score-display.tsx
│       └── game-over-screen.tsx
│
├── layout/                → Layout components
│   ├── header.tsx           (site header — NOT shown on /play)
│   ├── footer.tsx           (minimal footer)
│   └── nav-link.tsx         (navigation link with glow hover)
│
├── landing/               → Landing page components
│   ├── hero-title.tsx       (animated "DUST" title with decay)
│   ├── tagline.tsx          (letter-by-letter tagline reveal)
│   ├── play-button.tsx      (glowing CTA button)
│   └── background.tsx       (particle field + atmosphere)
│
├── providers.tsx          → All context providers (Clerk, Convex, Theme)
├── theme-provider.tsx     → next-themes provider
└── loader.tsx             → Loading spinner/skeleton
```

## Component Design Rules

### Visual Identity
Every component must follow the design system in the root CLAUDE.md. Key reminders:

1. **Colors:** Use CSS custom properties (`var(--accent-archive)`, etc.), NOT hardcoded hex values. This ensures consistency if we tweak the palette.

2. **Fonts:**
   - Game UI elements (score, timer, labels): `font-mono` (Space Mono)
   - Fake web page content: `font-serif` (Newsreader)
   - Buttons, navigation, tools: `font-sans` (DM Sans)

3. **Terminal Panel Pattern:** Many UI panels should use the terminal-panel component:
   ```tsx
   <TerminalPanel title="TOOLS" variant="compact">
     {/* tool contents */}
   </TerminalPanel>
   ```
   The terminal panel has: a title bar with colored dots (red/yellow/green), monospace title, dark background, subtle border glow.

4. **Animation:** Use Framer Motion for all animations. Common patterns:
   ```tsx
   // Fade-in on mount
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
   
   // Stagger children
   <motion.div variants={container} initial="hidden" animate="visible">
     {items.map(item => <motion.div variants={child} key={item.id}>)}
   </motion.div>
   
   // Glow pulse
   <motion.div animate={{ boxShadow: ["0 0 10px rgba(0,255,136,0.3)", "0 0 20px rgba(0,255,136,0.5)", "0 0 10px rgba(0,255,136,0.3)"] }} transition={{ repeat: Infinity, duration: 2 }}>
   ```

5. **No rounded-everything:** Mix sharp corners (terminal panels, code blocks) with selective rounding (buttons: `rounded-md`, badges: `rounded-full`). Don't default to `rounded-xl` on everything.

### Component Patterns

**Presentation components** (most components):
```tsx
interface DecayTimerProps {
  progress: number; // 0.0 to 1.0
  isUrgent: boolean;
}

export function DecayTimer({ progress, isUrgent }: DecayTimerProps) {
  // Pure rendering — reads props, renders UI
  // NO direct store access here
}
```

**Connected components** (page-level):
```tsx
export function GameScreen() {
  const { score, level, decayProgress } = useGameStore();
  // Connects store to presentation components
  return <DecayTimer progress={decayProgress} isUrgent={decayProgress > 0.75} />;
}
```

### Fake Web Page Components

The fake page renderers (`game/fake-page/`) are critical to the game's believability. They must:
- Look like REAL websites (not obviously fake)
- Use appropriate typography for each type (news = serif, blog = sans, social = system-like)
- Have realistic layouts (sidebars, headers, bylines, timestamps)
- Include visual details: author avatars (simple initials), category tags, reading time estimates
- Be wrapped in `page-chrome.tsx` which provides a fake browser URL bar and tab

Each section of the fake page must be individually selectable (clickable to mark for archiving). Use data attributes to identify sections.

### Custom UI Components

**`scanline-overlay.tsx`** — Position fixed, full viewport, `pointer-events: none`, CSS `background` with repeating linear gradient creating horizontal scan lines. Opacity ~0.03 (very subtle).

**`noise-texture.tsx`** — SVG filter-based noise texture applied as a background. Animated slightly to create "film grain" effect. Also `pointer-events: none`.

**`glow-text.tsx`** — Text component that adds a colored `text-shadow` glow. Props: `color` ('green' | 'red' | 'cyan' | 'amber'), `intensity` ('low' | 'medium' | 'high').

**`terminal-panel.tsx`** — Container styled like a terminal window. Has a title bar with 3 colored dots, monospace title text, dark background with subtle border. Props: `title`, `variant` ('default' | 'compact' | 'transparent').

**`particle-field.tsx`** — Canvas or CSS-based floating particles. Small dots that drift slowly across the screen like data dust. Used as background atmosphere on landing page and game screen.

**`glitch-text.tsx`** — Text that periodically glitches (CSS clip-path animation). Used for the "DUST" title on the landing page. Props: `text`, `intensity`, `interval`.
