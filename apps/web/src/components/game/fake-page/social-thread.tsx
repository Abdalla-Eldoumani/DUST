"use client";

import { memo } from "react";
import type { PageContent } from "@/lib/types";
import { DecayingPage } from "../decaying-page";
import { PageChrome } from "./page-chrome";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";

interface SocialThreadProps {
  content: PageContent;
  decayProgress: number;
  selectedSections: string[];
  onSelectSection?: (sectionId: string) => void;
}

/**
 * Renders content as social media posts — avatar, timestamps,
 * engagement metrics, thread/reply structure.
 */
export const SocialThread = memo(function SocialThread({
  content,
  decayProgress,
  selectedSections,
  onSelectSection,
}: SocialThreadProps) {
  const handle = `@${content.author.toLowerCase().replace(/\s/g, "_")}`;

  return (
    <PageChrome
      url={content.url}
      title={content.title}
      decayProgress={decayProgress}
      className="h-full"
    >
      {/* Post header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-scan/15 flex items-center justify-center text-scan font-mono text-xs border border-scan/30 shrink-0">
          {content.author[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-sm font-medium text-text-primary">
              {content.author}
            </span>
            <span className="font-sans text-xs text-text-ghost">{handle}</span>
            <span className="text-text-ghost">·</span>
            <span className="font-sans text-xs text-text-ghost">
              {content.date}
            </span>
          </div>
        </div>
      </div>

      <div className="pl-[52px]">
        <DecayingPage
          content={content}
          decayProgress={decayProgress}
          selectedSections={selectedSections}
          onSelectSection={onSelectSection}
        />

        {/* Engagement metrics */}
        <div className="mt-4 flex items-center gap-6 text-text-ghost pt-3 border-t border-white/5">
          <button className="flex items-center gap-1.5 text-xs hover:text-scan transition-colors">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>24</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-archive transition-colors">
            <Repeat2 className="h-3.5 w-3.5" />
            <span>148</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-decay transition-colors">
            <Heart className="h-3.5 w-3.5" />
            <span>1.2k</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-text-secondary transition-colors">
            <Share className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </PageChrome>
  );
});
