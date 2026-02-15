// A single section of a fake web page
export interface PageSection {
  id: string;
  text: string;
  isTrue: boolean;
  category: "headline" | "body" | "quote" | "statistic" | "attribution" | "metadata";
  decayOrder: number; // 1 (decays first) to 5 (decays last)
  archiveCost: number;
  imageSrc?: string; // URL for inline image sections
  imageAlt?: string; // Alt text for the image
  // Per-section tool analysis metadata (optional — used by analysis tools)
  falseReason?: string;
  sourceIssue?: string;
  dateIssue?: string;
  crossRefIssue?: string;
  emotionalLanguage?: string;
}

// Complete page content (returned by content generator)
export interface PageContent {
  id: string;
  title: string;
  contentType: "news" | "blog" | "social" | "wiki";
  author: string;
  date: string;
  url: string;
  sections: PageSection[];
  factCheckData: FactCheckData;
  difficulty: number; // 1-10
  decayDuration: number; // Seconds until full decay
}

// Data for fact-checking tools
export interface FactCheckData {
  sourceCredibility: number; // 0-100
  dateAccuracy: boolean;
  emotionalLanguageScore: number; // 0-100 (high = manipulative)
  crossReferenceHits: string[];
  authorHistory: string;
}

// An item the player has archived
export interface ArchivedItem {
  sectionId: string;
  sectionText: string;
  wasCorrect: boolean;
  pointsEarned: number;
  level: number;
  timestamp: number;
}

/**
 * Validates that a PageContent object has the minimum required fields
 * to be rendered without crashing.
 */
export function isValidPageContent(content: unknown): content is PageContent {
  if (!content || typeof content !== "object") return false;
  const c = content as Partial<PageContent>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    Array.isArray(c.sections) &&
    c.sections.length > 0 &&
    c.sections.every(
      (s) =>
        typeof s.id === "string" &&
        typeof s.text === "string" &&
        typeof s.isTrue === "boolean"
    )
  );
}

// Game state phases
export type GamePhase =
  | "menu"
  | "loading"
  | "playing"
  | "analyzing"
  | "archiving"
  | "revealing"
  | "results"
  | "gameover";

// Final game results
export interface GameResult {
  totalScore: number;
  accuracy: number; // Percentage of correctly archived items
  pagesCompleted: number;
  totalArchived: number;
  bestCombo: number;
  timePlayed: number; // Seconds
  level: number;
}
