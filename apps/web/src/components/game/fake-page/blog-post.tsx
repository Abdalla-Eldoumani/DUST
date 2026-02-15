"use client";

import { memo } from "react";
import type { PageContent } from "@/lib/types";
import { DecayingPage } from "../decaying-page";
import { PageChrome } from "./page-chrome";

interface BlogPostProps {
  content: PageContent;
  decayProgress: number;
  selectedSections: string[];
  onSelectSection?: (sectionId: string) => void;
}

/**
 * Renders content as a personal blog — warmer, more casual,
 * author avatar, reading time, tag-based layout.
 */
export const BlogPost = memo(function BlogPost({
  content,
  decayProgress,
  selectedSections,
  onSelectSection,
}: BlogPostProps) {
  const initials = content.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <PageChrome
      url={content.url}
      title={content.title}
      decayProgress={decayProgress}
      className="h-full"
    >
      {/* Blog header with author avatar */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-ghost/20 flex items-center justify-center text-ghost font-mono text-sm border border-ghost/30">
          {initials}
        </div>
        <div>
          <div className="font-sans text-sm text-text-primary">
            {content.author}
          </div>
          <div className="font-sans text-xs text-text-ghost">
            {content.date} · 4 min read
          </div>
        </div>
      </div>

      <DecayingPage
        content={content}
        decayProgress={decayProgress}
        selectedSections={selectedSections}
        onSelectSection={onSelectSection}
      />

      {/* Blog tags */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["opinion", "analysis", "personal"].map((tag) => (
          <span
            key={tag}
            className="font-sans text-xs px-2 py-0.5 bg-elevated/50 text-text-ghost border border-white/5 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>
    </PageChrome>
  );
});
