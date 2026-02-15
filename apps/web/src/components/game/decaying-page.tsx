"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useTextDecay } from "@/lib/decay/text-decay";
import { useLayoutDecay } from "@/lib/decay/layout-decay";
import { useColorDecay } from "@/lib/decay/color-decay";
import { useImageDecay } from "@/lib/decay/image-decay";
import { cn } from "@/lib/utils";
import type { PageContent, PageSection } from "@/lib/types";

interface DecayingPageProps {
  content: PageContent;
  decayProgress: number;
  selectedSections: string[];
  onSelectSection?: (sectionId: string) => void;
}

/**
 * Renders a full "web page" with all decay effects applied.
 * Sections decay at different rates based on their decayOrder.
 */
export const DecayingPage = memo(function DecayingPage({
  content,
  decayProgress,
  selectedSections,
  onSelectSection,
}: DecayingPageProps) {
  const colorDecay = useColorDecay(decayProgress);

  return (
    <div
      className="relative font-serif text-text-primary"
      style={{ filter: colorDecay.filter }}
    >
      {/* Page header area */}
      <div className="mb-6 border-b border-white/10 pb-4">
        <DecayingSection
          section={{
            id: "__title",
            text: content.title,
            isTrue: true,
            category: "headline",
            decayOrder: 5,
            archiveCost: 0,
          }}
          decayProgress={decayProgress}
          isSelected={false}
          elementIndex={0}
          isTitle
        />
        <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
          <DecayingText
            text={content.author}
            progress={decayProgress}
            decayOrder={2}
            className="font-sans"
          />
          <span className="text-text-ghost">|</span>
          <DecayingText
            text={content.date}
            progress={decayProgress}
            decayOrder={1}
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Page sections */}
      <div className="space-y-4">
        {content.sections.map((section, index) => (
          <DecayingSection
            key={section.id}
            section={section}
            decayProgress={decayProgress}
            isSelected={selectedSections.includes(section.id)}
            onSelect={onSelectSection}
            elementIndex={index + 1}
          />
        ))}
      </div>
    </div>
  );
});

/* ─── Sub-components ─── */

interface DecayingSectionProps {
  section: PageSection;
  decayProgress: number;
  isSelected: boolean;
  onSelect?: (sectionId: string) => void;
  elementIndex: number;
  isTitle?: boolean;
}

const DecayingSection = memo(function DecayingSection({
  section,
  decayProgress,
  isSelected,
  onSelect,
  elementIndex,
  isTitle,
}: DecayingSectionProps) {
  const layoutDecay = useLayoutDecay(decayProgress, elementIndex);
  const isClickable = onSelect && section.id !== "__title" && !section.imageSrc;

  return (
    <motion.div
      className={cn(
        "relative transition-colors",
        isClickable && "cursor-pointer hover:bg-white/[0.02] -mx-3 px-3 py-1",
        isSelected && "bg-archive/5 border-l-2 border-archive -mx-3 px-3 py-1"
      )}
      style={{
        transform: layoutDecay.transform,
        opacity: layoutDecay.opacity,
        filter: layoutDecay.filter,
        willChange: "transform, opacity",
      }}
      onClick={() => isClickable && onSelect(section.id)}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-archive shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
      )}

      {section.imageSrc ? (
        <DecayingImage
          src={section.imageSrc}
          alt={section.imageAlt ?? ""}
          progress={decayProgress}
        />
      ) : (
        <DecayingText
          text={section.text}
          progress={decayProgress}
          decayOrder={section.decayOrder}
          className={cn(
            isTitle
              ? "text-2xl font-bold font-mono leading-tight"
              : section.category === "quote"
                ? "italic border-l-2 border-text-ghost/30 pl-4 text-text-secondary"
                : section.category === "statistic"
                  ? "font-mono text-sm bg-surface/50 p-2 rounded"
                  : "leading-relaxed"
          )}
        />
      )}

      {!section.imageSrc && section.category === "attribution" && (
        <span className="text-xs text-text-ghost font-sans ml-2">
          — source
        </span>
      )}
    </motion.div>
  );
});

interface DecayingTextProps {
  text: string;
  progress: number;
  decayOrder: number;
  className?: string;
}

const DecayingText = memo(function DecayingText({
  text,
  progress,
  decayOrder,
  className,
}: DecayingTextProps) {
  const decayedText = useTextDecay(text, progress, decayOrder);
  return <span className={className}>{decayedText}</span>;
});


/* ─── Decaying Image ─── */

interface DecayingImageProps {
  src: string;
  alt: string;
  progress: number;
}

const DecayingImage = memo(function DecayingImage({
  src,
  alt,
  progress,
}: DecayingImageProps) {
  const imageDecay = useImageDecay(progress);

  return (
    <div className="my-2 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-80 w-auto h-auto object-contain rounded"
        style={{
          filter: imageDecay.filter,
          opacity: imageDecay.opacity,
          imageRendering: imageDecay.imageRendering as React.CSSProperties["imageRendering"],
          transform: imageDecay.transform,
        }}
        loading="lazy"
      />
    </div>
  );
});