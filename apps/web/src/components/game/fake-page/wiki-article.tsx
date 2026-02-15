"use client";

import { memo } from "react";
import type { PageContent } from "@/lib/types";
import { DecayingPage } from "../decaying-page";
import { PageChrome } from "./page-chrome";

interface WikiArticleProps {
  content: PageContent;
  decayProgress: number;
  selectedSections: string[];
  onSelectSection?: (sectionId: string) => void;
}

/**
 * Renders content as a wiki/encyclopedia entry — table of contents,
 * "Edit" links, citation-style references, neutral tone.
 */
export const WikiArticle = memo(function WikiArticle({
  content,
  decayProgress,
  selectedSections,
  onSelectSection,
}: WikiArticleProps) {
  return (
    <PageChrome
      url={content.url}
      title={content.title}
      decayProgress={decayProgress}
      className="h-full"
    >
      {/* Wiki header */}
      <div className="mb-4 border-b border-white/10 pb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-xs text-text-ghost uppercase tracking-wider mb-1">
            Encyclopedia
          </div>
        </div>
        <div className="flex gap-3 text-xs font-sans text-text-ghost">
          <span className="hover:text-scan cursor-default">[edit]</span>
          <span className="hover:text-scan cursor-default">[history]</span>
          <span className="hover:text-scan cursor-default">[talk]</span>
        </div>
      </div>

      {/* Table of contents */}
      <div className="mb-5 p-3 bg-elevated/30 border border-white/5 text-xs">
        <div className="font-mono text-text-secondary mb-2 font-bold">
          Contents
        </div>
        <ol className="list-decimal list-inside space-y-1 text-scan/70 font-sans">
          <li className="hover:text-scan cursor-default">Overview</li>
          <li className="hover:text-scan cursor-default">Background</li>
          <li className="hover:text-scan cursor-default">Details</li>
          <li className="hover:text-scan cursor-default">References</li>
        </ol>
      </div>

      <DecayingPage
        content={content}
        decayProgress={decayProgress}
        selectedSections={selectedSections}
        onSelectSection={onSelectSection}
      />

      {/* Wiki references */}
      <div className="mt-6 pt-3 border-t border-white/5">
        <div className="font-mono text-xs text-text-ghost mb-2">
          References
        </div>
        <div className="space-y-1 text-xs text-text-ghost font-sans">
          <div>
            [1] Source document, archived {content.date}
          </div>
          <div>[2] Secondary verification pending</div>
          <div>[3] Cross-reference: see linked articles</div>
        </div>
      </div>
    </PageChrome>
  );
});
