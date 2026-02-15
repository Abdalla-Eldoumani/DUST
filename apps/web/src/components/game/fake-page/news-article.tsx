"use client";

import { memo } from "react";
import type { PageContent } from "@/lib/types";
import { DecayingPage } from "../decaying-page";
import { PageChrome } from "./page-chrome";

interface NewsArticleProps {
  content: PageContent;
  decayProgress: number;
  selectedSections: string[];
  onSelectSection?: (sectionId: string) => void;
}

/**
 * Renders content as a news website — serif font, formal layout,
 * byline, date, newspaper-style aesthetic.
 */
export const NewsArticle = memo(function NewsArticle({
  content,
  decayProgress,
  selectedSections,
  onSelectSection,
}: NewsArticleProps) {
  return (
    <PageChrome
      url={content.url}
      title={content.title}
      decayProgress={decayProgress}
      className="h-full"
    >
      {/* News site header bar */}
      <div className="mb-4 border-b border-white/10 pb-3">
        <div className="font-mono text-xs text-decay/70 uppercase tracking-[0.2em] mb-1">
          Breaking News
        </div>
        <div className="h-px bg-decay/30 mb-2" />
      </div>

      <DecayingPage
        content={content}
        decayProgress={decayProgress}
        selectedSections={selectedSections}
        onSelectSection={onSelectSection}
      />

      {/* News footer */}
      <div className="mt-6 pt-3 border-t border-white/5 text-xs text-text-ghost font-sans">
        <span>Filed under: General News</span>
        <span className="mx-2">|</span>
        <span>Comments: Disabled</span>
      </div>
    </PageChrome>
  );
});
