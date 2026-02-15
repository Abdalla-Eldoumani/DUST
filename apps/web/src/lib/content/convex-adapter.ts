import type { PageContent, PageSection, FactCheckData } from "@/lib/types";
import { getDifficulty } from "./difficulty";

/**
 * Shape of an element inside the alteredContent JSON string.
 */
interface AlteredElement {
  elementId: string;
  type: string; // e.g. "h1", "p", "li", "blockquote"
  text?: string;
  src?: string;
  alt?: string;
}

/**
 * Shape of a fakeMarks entry from the Convex pageVariants table.
 */
interface FakeMark {
  kind: "FAKE" | "MISLEADING";
  elementId?: string | null;
  snippet: string;
  explanation: string;
}

/**
 * Minimal Convex variant document shape (what useQuery returns).
 */
export interface ConvexVariant {
  _id: string;
  variantId: string;
  pageId: string;
  levelId: string;
  difficulty: number;
  alteredContent: string; // JSON-stringified array of AlteredElement
  fakeMarks: FakeMark[];
  projectId: string;
}

// Regex to strip <FAKE: ...> and <MISLEADING: ...> wrapper tags
const TAG_RE = /<(?:FAKE|MISLEADING):\s*([^>]*)>/gi;
const SENTENCE_END_PATTERN = /[.!?]["')\]]?(?=\s|$)/;

/**
 * Strip `<FAKE: xyz>` and `<MISLEADING: xyz>` tags from text,
 * keeping the inner content so the player sees clean readable text.
 */
function stripTags(text: string): string {
  return text.replace(TAG_RE, "$1").trim();
}

function toCompleteSentences(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (/[.!?]["')\]]?$/.test(normalized)) return normalized;

  const matches = Array.from(
    normalized.matchAll(new RegExp(SENTENCE_END_PATTERN.source, "g"))
  );
  if (matches.length === 0) return normalized;

  const last = matches[matches.length - 1];
  const end = (last.index ?? 0) + last[0].length;
  if (end >= Math.min(80, normalized.length * 0.5)) {
    return normalized.slice(0, end).trim();
  }
  return normalized;
}

function sentenceCount(text: string): number {
  return (text.match(new RegExp(SENTENCE_END_PATTERN.source, "g")) ?? []).length;
}

function isLikelyNoise(text: string): boolean {
  const clean = text.trim();
  if (clean.length === 0) return true;
  if (clean.length >= 28) return false;
  if (/\d/.test(clean)) return false;
  return sentenceCount(clean) === 0;
}

function normalizeComparable(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function splitTextIntoTwoChunks(text: string): [string, string] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const sentenceMatches = trimmed.match(/[^.!?]+[.!?]["')\]]?/g) ?? [];
  if (sentenceMatches.length >= 2) {
    const cut = Math.ceil(sentenceMatches.length / 2);
    const first = sentenceMatches.slice(0, cut).join(" ").trim();
    const second = sentenceMatches.slice(cut).join(" ").trim();
    if (first && second) return [first, second];
  }

  const words = trimmed.split(/\s+/);
  if (words.length < 8) return null;
  const mid = Math.floor(words.length / 2);
  const first = words.slice(0, mid).join(" ").trim();
  const second = words.slice(mid).join(" ").trim();
  if (!first || !second) return null;
  return [first, second];
}

/**
 * Determine a category for a section based on the HTML tag.
 */
function tagToCategory(tag: string): PageSection["category"] {
  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
      return "headline";
    case "blockquote":
      return "quote";
    case "figcaption":
    case "cite":
      return "attribution";
    case "time":
    case "span":
      return "metadata";
    default:
      return "body";
  }
}

/**
 * Detect the content type from the URL or title.
 */
function inferContentType(
  url?: string,
  title?: string
): PageContent["contentType"] {
  const text = `${url ?? ""} ${title ?? ""}`.toLowerCase();
  if (text.includes("wiki") || text.includes("encyclopedia")) return "wiki";
  if (text.includes("blog") || text.includes("medium")) return "blog";
  if (
    text.includes("thread") ||
    text.includes("social") ||
    text.includes("twitter") ||
    text.includes("reddit")
  )
    return "social";
  return "news";
}

function parseHtmlAlteredElements(rawHtml: string): AlteredElement[] {
  if (typeof DOMParser === "undefined") return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  let nodes = Array.from(doc.querySelectorAll("[data-element-id]"));
  if (nodes.length === 0) {
    nodes = Array.from(
      doc.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,pre,code,img"
      )
    );
  }

  return nodes
    .map((node, idx) => {
      const type = node.tagName.toLowerCase();
      const elementId = node.getAttribute("data-element-id") ?? `html-${idx}`;

      if (type === "img") {
        const img = node as HTMLImageElement;
        const alt = img.getAttribute("alt") ?? "";
        return {
          elementId,
          type,
          text: alt.trim(),
          src: img.getAttribute("src") ?? undefined,
          alt: alt || undefined,
        };
      }

      return {
        elementId,
        type,
        text: (node.textContent ?? "").trim(),
      };
    })
    .filter((el) => !!(el.text && el.text.trim().length > 0) || !!el.src);
}

function parseAlteredElements(raw: string): AlteredElement[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((el, idx) => {
          const elementId =
            typeof el?.elementId === "string" && el.elementId
              ? el.elementId
              : `json-${idx}`;
          const type =
            typeof el?.type === "string" && el.type ? el.type : "p";
          const text =
            typeof el?.text === "string"
              ? el.text
              : typeof el?.alt === "string"
                ? el.alt
                : "";
          return {
            elementId,
            type,
            text,
            src: typeof el?.src === "string" ? el.src : undefined,
            alt: typeof el?.alt === "string" ? el.alt : undefined,
          } satisfies AlteredElement;
        })
        .filter((el) => (el.text && el.text.trim().length > 0) || !!el.src);
    }
  } catch {
    // Fall through to HTML parser.
  }

  return parseHtmlAlteredElements(raw);
}

/**
 * Convert a Convex pageVariant document into the PageContent format
 * the game engine expects.
 */
export function variantToPageContent(
  variant: ConvexVariant,
  originalPage?: { url: string; title: string }
): PageContent {
  const rawElements = parseAlteredElements(variant.alteredContent);

  // Build a set of elementIds that have fakes
  const fakeElementIds = new Set(
    variant.fakeMarks
      .filter((m) => m.elementId)
      .map((m) => m.elementId!)
  );

  // Build a set of fake snippets (for elements where elementId wasn't matched)
  const fakeSnippets = variant.fakeMarks.map((m) => m.snippet.toLowerCase());

  // Map elements to PageSections
  const parsedSections: PageSection[] = rawElements.flatMap((el, idx) => {
    const rawText = el.text ?? "";
    const cleanText = toCompleteSentences(stripTags(rawText));
    const isImage = el.type === "img" && !!el.src;

    // Allow image-only elements through even without text
    if (!cleanText && !isImage) return [];
    if (!isImage && el.type !== "h1" && el.type !== "h2" && isLikelyNoise(cleanText)) return [];

    const category = isImage ? "body" as const : tagToCategory(el.type);

    // Determine if this element contains fake/misleading content
    const hasFakeById = fakeElementIds.has(el.elementId);
    const hasFakeBySnippet = fakeSnippets.some((s) =>
      rawText.toLowerCase().includes(s)
    );
    const isFake = hasFakeById || hasFakeBySnippet;

    return [{
      id: el.elementId,
      text: cleanText,
      isTrue: isImage ? true : !isFake, // images are not misinformation targets
      category,
      decayOrder: category === "headline" ? 5 : category === "metadata" ? 1 : 3 - Math.min(idx, 2),
      archiveCost: isImage ? 0 : 1, // images don't cost energy
      ...(isImage ? { imageSrc: el.src, imageAlt: el.alt ?? "" } : {}),
    }];
  });

  // Merge adjacent short sections so output feels like full paragraphs.
  // Never merge image sections — they must stay standalone.
  const sections: PageSection[] = [];
  for (const section of parsedSections) {
    const prev = sections[sections.length - 1];
    const isImageSection = !!section.imageSrc;
    const prevIsImage = !!prev?.imageSrc;
    const mergeableCategory =
      section.category === "body" ||
      section.category === "quote" ||
      section.category === "attribution";
    const canMerge =
      !!prev &&
      !isImageSection &&
      !prevIsImage &&
      mergeableCategory &&
      prev.category === section.category &&
      prev.text.length < 280 &&
      section.text.length < 220 &&
      sentenceCount(prev.text) < 3;

    if (canMerge && prev) {
      prev.text = `${prev.text} ${section.text}`.replace(/\s+/g, " ").trim();
      prev.isTrue = prev.isTrue && section.isTrue;
      continue;
    }

    sections.push(section);
  }

  // Limit images: at most 1 before the first text section and 1 after the last.
  // Drop any other image sections so the page doesn't become an image gallery.
  const firstTextIdx = sections.findIndex((s) => !s.imageSrc);
  const lastTextIdx = sections.findLastIndex((s) => !s.imageSrc);
  let leadingImageKept = false;
  let trailingImageKept = false;
  const imageLimited = sections.filter((s, i) => {
    if (!s.imageSrc) return true; // always keep text sections
    if (i < firstTextIdx && !leadingImageKept) {
      leadingImageKept = true;
      return true;
    }
    if (i > lastTextIdx && !trailingImageKept) {
      trailingImageKept = true;
      return true;
    }
    return false; // drop all other images
  });
  sections.length = 0;
  sections.push(...imageLimited);

  // Use the original page title/url if available, else synthesize from elements
  const title =
    originalPage?.title ??
    sections.find((s) => s.category === "headline")?.text ??
    "Archived Page";
  const normalizedTitle = normalizeComparable(title);
  const dedupedSections = sections.filter((section, idx) => {
    if (idx !== 0 || section.category !== "headline") return true;
    return normalizeComparable(section.text) !== normalizedTitle;
  });
  let finalSections = dedupedSections.length > 0 ? dedupedSections : sections;

  // Guarantee at least two sections for gameplay.
  if (finalSections.length === 0) {
    finalSections = [
      {
        id: `${variant.variantId}-title`,
        text: title,
        isTrue: true,
        category: "headline",
        decayOrder: 5,
        archiveCost: 1,
      },
      {
        id: `${variant.variantId}-body`,
        text: "Archived excerpt unavailable. Use available verification tools with caution.",
        isTrue: false,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
    ];
  } else if (finalSections.length === 1) {
    const only = finalSections[0]!;
    const split = splitTextIntoTwoChunks(only.text);
    if (split) {
      finalSections = [
        { ...only, text: split[0] },
        {
          ...only,
          id: `${only.id}__2`,
          text: split[1],
          category: only.category === "headline" ? "body" : only.category,
          decayOrder: Math.max(1, only.decayOrder - 1),
        },
      ];
    } else {
      finalSections = [
        only,
        {
          id: `${only.id}__2`,
          text: "Additional archived context could not be reconstructed from this source snapshot.",
          isTrue: true,
          category: "body",
          decayOrder: 2,
          archiveCost: 1,
        },
      ];
    }
  }

  // Guarantee at least one fake section.
  if (!finalSections.some((s) => !s.isTrue)) {
    const fakeIdx = finalSections.findIndex((s) => s.category !== "headline");
    const idx = fakeIdx >= 0 ? fakeIdx : 0;
    finalSections = finalSections.map((s, i) =>
      i === idx ? { ...s, isTrue: false } : s
    );
  }
  const url = originalPage?.url ?? `archive://sector-${variant.variantId}`;

  const difficulty = variant.difficulty;
  const { decayDuration } = getDifficulty(difficulty);
  const contentType = inferContentType(url, title);

  const factCheckData = buildFactCheckData(
    variant,
    finalSections,
    contentType,
    difficulty
  );

  return {
    id: variant.variantId,
    title,
    contentType,
    author: factCheckData._author,
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    url,
    sections: finalSections,
    factCheckData,
    difficulty,
    decayDuration,
  };
}

// ─── Analysis Tool Data Generation ────────────────────────────────────

const EMOTIONAL_WORDS = new Set([
  "shocking", "outrage", "devastating", "incredible", "alarming",
  "horrifying", "terrifying", "unbelievable", "bombshell", "explosive",
  "crisis", "catastrophe", "disaster", "nightmare", "scandal",
  "heartbreaking", "sickening", "disgusting", "infuriating", "corrupt",
  "deadly", "panic", "chaos", "urgent", "emergency", "destroy",
  "slam", "blast", "rip", "savage", "brutal", "insane", "crazy",
  "wild", "epic", "massive", "enormous", "skyrocket", "plummet",
  "surge", "crash", "soar", "collapse", "breakthrough", "revolutionary",
  "unprecedented", "historic", "exclusive", "breaking", "busted",
  "exposed", "revealed", "secret", "hidden", "banned", "censored",
]);

const DATE_KEYWORDS = /\b(date|year|years|timeline|century|centuries|ago|period|era|decade|month|annual|founded|established|invented)\b/i;

const AUTHOR_POOL: Record<PageContent["contentType"], string[]> = {
  news: [
    "Established news outlet — generally factual but occasionally sensationalizes for engagement.",
    "Regional news desk with mixed editorial standards. Verify statistics independently.",
    "Well-known publication, but this reporter has a history of citing unverified sources.",
    "Wire service with broad sourcing. Individual articles may reflect editorial bias.",
  ],
  blog: [
    "Personal blog with no institutional affiliation. Claims are opinion-heavy.",
    "Independent journalist — insightful analysis but occasionally presents anecdotes as data.",
    "Subject-matter enthusiast. Some claims lack peer-reviewed backing.",
    "Popular blogger who mixes personal experience with cherry-picked statistics.",
  ],
  social: [
    "Anonymous social media account — no verifiable credentials.",
    "Popular commentary account. Mixes real data with unverified claims for engagement.",
    "Unverified account with growing following. Sources are rarely linked.",
    "Pseudonymous account. Some claims cannot be independently verified.",
  ],
  wiki: [
    "Community-edited encyclopedia — generally reliable but check specific statistics.",
    "Collaborative knowledge base. Most claims are sourced, but some citations are outdated.",
    "Community-maintained reference. High reliability on common topics, watch for niche inaccuracies.",
    "Open encyclopedia with editorial review. Subtle errors may persist in lesser-trafficked articles.",
  ],
};

/**
 * Build rich, gameplay-useful FactCheckData by analyzing the variant's
 * actual content, fakeMarks, sections, and content type.
 */
function buildFactCheckData(
  variant: ConvexVariant,
  sections: PageSection[],
  contentType: PageContent["contentType"],
  difficulty: number
): FactCheckData & { _author: string } {
  const fakeMarks = variant.fakeMarks;
  const fakeSections = sections.filter((s) => !s.isTrue);
  const trueSections = sections.filter((s) => s.isTrue);
  const fakeRatio = sections.length > 0 ? fakeSections.length / sections.length : 0;

  // ── Source Credibility ──
  // Base by content type, then adjust by fake density and difficulty
  const baseCredibility: Record<PageContent["contentType"], number> = {
    wiki: 78,
    news: 65,
    blog: 48,
    social: 38,
  };
  const credBase = baseCredibility[contentType] ?? 55;
  const fakePenalty = Math.round(fakeRatio * 25);
  const difficultyShift = Math.round((difficulty - 5) * 3);
  // Small deterministic variance from variantId hash
  const hash = variant.variantId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = (hash % 11) - 5; // -5 to +5
  const sourceCredibility = Math.max(15, Math.min(95, credBase - fakePenalty - difficultyShift + jitter));

  // ── Date Accuracy ──
  // False when any fakeMarks mention date/time-related terms
  const dateAccuracy = !fakeMarks.some(
    (m) => DATE_KEYWORDS.test(m.snippet) || DATE_KEYWORDS.test(m.explanation)
  );

  // ── Emotional Language Score ──
  // Scan all section text for emotional words
  const allText = sections.map((s) => s.text).join(" ").toLowerCase();
  const words = allText.split(/\s+/);
  let emotionalHits = 0;
  for (const w of words) {
    const cleaned = w.replace(/[^a-z]/g, "");
    if (EMOTIONAL_WORDS.has(cleaned)) emotionalHits++;
  }
  const emotionalRatio = words.length > 0 ? emotionalHits / words.length : 0;
  // Map to 0-100: ~0% emotional words → 5, ~3%+ → 85
  const rawEmoScore = Math.round(emotionalRatio * 2800);
  const difficultyBoost = Math.round(difficulty * 2);
  const emotionalLanguageScore = Math.max(5, Math.min(95, rawEmoScore + difficultyBoost));

  // ── Cross-Reference Hits ──
  const crossReferenceHits: string[] = [];

  // Add supporting references for true sections (pick up to 2)
  const trueForHints = trueSections.slice(0, 2);
  for (const section of trueForHints) {
    const snippet = section.text.length > 60
      ? section.text.slice(0, 60).replace(/\s+\S*$/, "") + "…"
      : section.text;
    const templates = [
      `Claim regarding "${snippet}" is consistent with widely cited sources.`,
      `The statement about "${snippet}" aligns with established records.`,
      `"${snippet}" — this information is corroborated by multiple references.`,
    ];
    crossReferenceHits.push(templates[hash % templates.length]!);
  }

  // Add contradicting references for fake marks (all of them — these are the clues)
  for (const mark of fakeMarks) {
    const explanation = mark.explanation;
    // Rephrase as a cross-reference finding rather than a raw explanation
    const templates = [
      `⚠ ${explanation}`,
      `Discrepancy noted: ${explanation}`,
      `Primary sources contradict this claim — ${explanation}`,
    ];
    crossReferenceHits.push(templates[(hash + crossReferenceHits.length) % templates.length]!);
  }

  // If we still have fewer than 3 hits, pad with neutral observations
  while (crossReferenceHits.length < 3) {
    crossReferenceHits.push(
      "Insufficient archived data to cross-reference remaining claims."
    );
  }

  // ── Author History ──
  const pool = AUTHOR_POOL[contentType] ?? AUTHOR_POOL.news;
  const authorHistory = pool[hash % pool.length]!;
  // Also pick a display author name
  const authorNames: Record<PageContent["contentType"], string[]> = {
    news: ["Associated Wire", "Metro Desk Report", "Staff Correspondent", "Editorial Board"],
    blog: ["Independent Writer", "Guest Contributor", "Freelance Analyst", "Subject Enthusiast"],
    social: ["Anonymous User", "Unverified Account", "Community Member", "Online Commentator"],
    wiki: ["Encyclopedia Contributors", "Community Editors", "Volunteer Authors", "Open Editors"],
  };
  const authorPool = authorNames[contentType] ?? authorNames.news;
  const _author = authorPool[hash % authorPool.length]!;

  return {
    sourceCredibility,
    dateAccuracy,
    emotionalLanguageScore,
    crossReferenceHits,
    authorHistory,
    _author,
  };
}
