"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Snowflake, Sparkles, Trash2, XCircle } from "lucide-react";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { cn } from "@/lib/utils";

export interface LifelineStatus {
  verifyUsed: boolean;
  verifyArmed: boolean;
  freezeUsed: boolean;
  freezeActive: boolean;
  purgeUsed: boolean;
  lastVerifyResult?: {
    sectionText: string;
    isTrue: boolean;
  } | null;
  lastPurgedText?: string | null;
}

interface ToolPanelProps {
  decayProgress: number;
  className?: string;
  lifelineStatus?: LifelineStatus;
  onUseVerify?: () => void;
  onUseFreeze?: () => void;
  onUsePurge?: () => void;
  // Legacy props kept optional for compatibility with existing callsites.
  factCheckData?: unknown;
  sections?: unknown;
  selectedSectionId?: string | null;
}

const DEFAULT_STATUS: LifelineStatus = {
  verifyUsed: false,
  verifyArmed: false,
  freezeUsed: false,
  freezeActive: false,
  purgeUsed: false,
  lastVerifyResult: null,
  lastPurgedText: null,
};

export function ToolPanel({
  decayProgress,
  className,
  lifelineStatus,
  onUseVerify,
  onUseFreeze,
  onUsePurge,
}: ToolPanelProps) {
  const status = lifelineStatus ?? DEFAULT_STATUS;
  const hasLifelineActions = Boolean(onUseVerify || onUseFreeze || onUsePurge);

  const verifyDisabled = status.verifyUsed || !onUseVerify;
  const freezeDisabled = status.freezeUsed || !onUseFreeze;
  const purgeDisabled = status.purgeUsed || !onUsePurge;

  return (
    <TerminalPanel
      title="LIFELINES"
      variant="compact"
      glowColor="cyan"
      className={className}
    >
      <div className="flex min-h-0 flex-col">
        <div className="space-y-2">
          <button
            onClick={onUseVerify}
            disabled={verifyDisabled}
            className={cn(
              "w-full min-h-[62px] border p-2.5 text-left transition-all",
              verifyDisabled
                ? "cursor-not-allowed bg-elevated/15 border-white/5 text-text-ghost/50"
                : status.verifyArmed
                  ? "bg-scan/10 border-scan/35 text-scan"
                  : "bg-elevated/20 border-white/5 text-text-ghost hover:text-text-secondary hover:border-white/15"
            )}
          >
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wide">
                  Verify {status.verifyUsed ? "• Used" : ""}
                </p>
                <p className="mt-1 text-xs font-sans leading-snug text-text-ghost">
                  Reveal whether one section is legit or fabricated.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onUseFreeze}
            disabled={freezeDisabled}
            className={cn(
              "w-full min-h-[62px] border p-2.5 text-left transition-all",
              freezeDisabled
                ? "cursor-not-allowed bg-elevated/15 border-white/5 text-text-ghost/50"
                : status.freezeActive
                  ? "bg-archive/10 border-archive/35 text-archive"
                  : "bg-elevated/20 border-white/5 text-text-ghost hover:text-text-secondary hover:border-white/15"
            )}
          >
            <div className="flex items-start gap-2.5">
              <Snowflake className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wide">
                  Freeze {status.freezeUsed ? "• Used" : ""}
                </p>
                <p className="mt-1 text-xs font-sans leading-snug text-text-ghost">
                  Pause decay until you select any section.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onUsePurge}
            disabled={purgeDisabled}
            className={cn(
              "w-full min-h-[62px] border p-2.5 text-left transition-all",
              purgeDisabled
                ? "cursor-not-allowed bg-elevated/15 border-white/5 text-text-ghost/50"
                : "bg-elevated/20 border-white/5 text-text-ghost hover:text-text-secondary hover:border-white/15"
            )}
          >
            <div className="flex items-start gap-2.5">
              <Trash2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wide">
                  Purge {status.purgeUsed ? "• Used" : ""}
                </p>
                <p className="mt-1 text-xs font-sans leading-snug text-text-ghost">
                  Remove one incorrect section from the page.
                </p>
              </div>
            </div>
          </button>
        </div>

        <p
          className={cn(
            "mt-2 font-mono text-[11px] uppercase tracking-wide",
            decayProgress >= 0.75 ? "text-decay" : "text-text-ghost"
          )}
        >
          Integrity remaining: {Math.max(0, Math.round((1 - decayProgress) * 100))}%
        </p>

        <div className="mt-3 border-t border-white/5 pt-3">
          <div className="border border-white/10 bg-elevated/10 px-3 py-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${status.verifyArmed}-${status.freezeActive}-${status.lastVerifyResult?.sectionText ?? "none"}-${status.lastPurgedText ?? "none"}-${hasLifelineActions}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {!hasLifelineActions && (
                  <p className="text-sm text-text-ghost font-sans">
                    Lifelines are active in solo mode.
                  </p>
                )}

                {hasLifelineActions && !status.verifyArmed && !status.freezeActive && !status.lastVerifyResult && !status.lastPurgedText && (
                  <p className="text-sm text-text-ghost font-sans">
                    Use each lifeline once to gain an edge.
                  </p>
                )}

                {status.verifyArmed && (
                  <div className="flex items-start gap-2 text-scan">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm font-sans">
                      Verify armed. Click one section to reveal whether it is legit.
                    </p>
                  </div>
                )}

                {status.freezeActive && (
                  <div className="flex items-start gap-2 text-archive">
                    <Snowflake className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm font-sans">
                      Decay is frozen until you select a section.
                    </p>
                  </div>
                )}

                {status.lastVerifyResult && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      {status.lastVerifyResult.isTrue ? (
                        <CheckCircle2 className="h-4 w-4 text-archive" />
                      ) : (
                        <XCircle className="h-4 w-4 text-decay" />
                      )}
                      <span
                        className={cn(
                          "font-mono text-[11px] uppercase tracking-wide",
                          status.lastVerifyResult.isTrue ? "text-archive" : "text-decay"
                        )}
                      >
                        {status.lastVerifyResult.isTrue ? "Verified Legit" : "Verified False"}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-text-secondary leading-relaxed">
                      {status.lastVerifyResult.sectionText}
                    </p>
                  </div>
                )}

                {status.lastPurgedText && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="h-4 w-4 text-amber" />
                      <span className="font-mono text-[11px] uppercase tracking-wide text-amber">
                        Purged False Section
                      </span>
                    </div>
                    <p className="text-xs font-sans text-text-secondary leading-relaxed">
                      {status.lastPurgedText}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}
