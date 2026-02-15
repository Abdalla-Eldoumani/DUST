"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import { variantToPageContent, type ConvexVariant } from "@/lib/content/convex-adapter";
import { useDecayEngine } from "@/lib/decay/decay-engine";
import { GAME_CONSTANTS } from "@/lib/constants";
import { DecayingPage } from "@/components/game/decaying-page";
import { ToolPanel } from "@/components/game/tools/tool-panel";
import { EnergyBar } from "@/components/game/archive/energy-bar";
import { ArchiveButton } from "@/components/game/archive/archive-button";
import { DecayTimer } from "@/components/game/decay-timer";
import { OpponentStatus } from "./opponent-status";
import { GlowText } from "@/components/ui/glow-text";
import { LogOut } from "lucide-react";
import type { PlayerInfo } from "@/app/multiplayer/[code]/page";

function variantIndexForRound(
  roomId: Id<"multiplayerRooms">,
  currentRound: number,
  count: number
): number {
  if (count <= 1) return 0;
  const key = `${String(roomId)}:${currentRound}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

interface RaceGameProps {
  roomId: Id<"multiplayerRooms">;
  currentRound: number;
  contentId: string;
  isHost: boolean;
  otherPlayers: PlayerInfo[];
}

export function RaceGame({
  roomId,
  currentRound,
  contentId,
  isHost,
  otherPlayers,
}: RaceGameProps) {
  const router = useRouter();
  const { user } = useUser();
  const submitAction = useMutation(api.multiplayer.submitAction);
  const endRound = useMutation(api.multiplayer.endRound);
  const leaveRoom = useMutation(api.multiplayer.leaveRoom);
  const roundActions = useQuery(api.multiplayer.getRoundActions, {
    roomId,
    round: currentRound,
  });
  const variantsForLevel = useQuery(api.pageVariants.getByLevelId, {
    levelId: contentId,
  });

  const content = useMemo(() => {
    if (!variantsForLevel || variantsForLevel.length === 0) return null;
    const sorted = [...variantsForLevel].sort((a, b) =>
      String((a as unknown as ConvexVariant).variantId).localeCompare(
        String((b as unknown as ConvexVariant).variantId)
      )
    );
    const idx = variantIndexForRound(roomId, currentRound, sorted.length);
    return variantToPageContent(sorted[idx] as unknown as ConvexVariant);
  }, [variantsForLevel, roomId, currentRound]);

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [archiveEnergy, setArchiveEnergy] = useState<number>(GAME_CONSTANTS.BASE_ARCHIVE_ENERGY);
  const [decayProgress, setDecayProgress] = useState(0);
  const [hasArchived, setHasArchived] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const roundEndedRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const decayEngine = useDecayEngine({
    duration: content?.decayDuration ?? 60,
    onProgress: setDecayProgress,
  });

  // Start decay
  useEffect(() => {
    if (!content) return;
    decayEngine.reset();
    decayEngine.start();
    return () => decayEngine.pause();
  }, [currentRound, content?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive which other players have archived from roundActions
  const archivedPlayerIds = useMemo(() => {
    if (!roundActions || !user) return [] as string[];
    return roundActions
      .filter((a: { action: string; clerkId: string }) => a.action === "archive" && a.clerkId !== user.id)
      .map((a: { action: string; clerkId: string }) => a.clerkId);
  }, [roundActions, user]);

  const allOthersArchived = archivedPlayerIds.length >= otherPlayers.length;

  // Handle decay timeout — auto-submit when time runs out
  useEffect(() => {
    if (!decayEngine.isComplete || hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;

    if (hasArchived) return; // already submitted

    if (selectedSections.length > 0) {
      handleArchive();
    } else {
      // No selections — submit score of 0
      setHasArchived(true);
      setRoundScore(0);
      submitAction({
        roomId,
        action: "archive",
        data: "0",
      }).catch(() => {});
    }
  }, [decayEngine.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-end round when all players have archived
  useEffect(() => {
    if (!hasArchived || !allOthersArchived || roundEndedRef.current) return;
    roundEndedRef.current = true;

    // Build scoreUpdates from all archive actions
    const scoreUpdates: { clerkId: string; scoreAdd: number }[] = [];

    // Add my score
    if (user) {
      scoreUpdates.push({ clerkId: user.id, scoreAdd: roundScore });
    }

    // Add other players' scores from their action data
    if (roundActions) {
      for (const other of otherPlayers) {
        const action = roundActions.find(
          (a: { action: string; clerkId: string; data?: string }) => a.action === "archive" && a.clerkId === other.clerkId
        );
        const score = action?.data ? parseInt(action.data, 10) || 0 : 0;
        scoreUpdates.push({ clerkId: other.clerkId, scoreAdd: score });
      }
    }

    endRound({ roomId, scoreUpdates });
  }, [hasArchived, allOthersArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety net: if we archived but not all others have after 10s, host force-advances
  useEffect(() => {
    if (!hasArchived || allOthersArchived || !isHost) return;
    safetyTimerRef.current = setTimeout(() => {
      if (roundEndedRef.current) return;
      roundEndedRef.current = true;

      // Build scoreUpdates with what we have
      const scoreUpdates: { clerkId: string; scoreAdd: number }[] = [];
      if (user) {
        scoreUpdates.push({ clerkId: user.id, scoreAdd: roundScore });
      }
      if (roundActions) {
        for (const other of otherPlayers) {
          const action = roundActions.find(
            (a: { action: string; clerkId: string; data?: string }) => a.action === "archive" && a.clerkId === other.clerkId
          );
          const score = action?.data ? parseInt(action.data, 10) || 0 : 0;
          scoreUpdates.push({ clerkId: other.clerkId, scoreAdd: score });
        }
      }

      endRound({ roomId, scoreUpdates });
    }, 10000);
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [hasArchived, allOthersArchived, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (sectionId: string) => {
      if (!content || hasArchived) return;
      const section = content.sections.find((s) => s.id === sectionId);
      if (!section) return;

      if (selectedSections.includes(sectionId)) {
        setSelectedSections((prev) => prev.filter((id) => id !== sectionId));
        setArchiveEnergy((e) => e + section.archiveCost);
      } else {
        if (archiveEnergy < section.archiveCost) return;
        setSelectedSections((prev) => [...prev, sectionId]);
        setArchiveEnergy((e) => e - section.archiveCost);
      }
    },
    [content, hasArchived, selectedSections, archiveEnergy]
  );

  const handleArchive = useCallback(async () => {
    if (!content || hasArchived || selectedSections.length === 0) return;
    setHasArchived(true);

    // Score selected sections
    let score = 0;
    for (const sId of selectedSections) {
      const section = content.sections.find((s) => s.id === sId);
      if (!section) continue;
      if (section.isTrue) {
        score += GAME_CONSTANTS.CORRECT_ARCHIVE_POINTS;
        if (decayProgress >= 0.9) score += GAME_CONSTANTS.CLUTCH_SAVE_BONUS;
      } else {
        score += GAME_CONSTANTS.MISINFO_ARCHIVE_PENALTY;
      }
    }

    // Speed bonus if first to archive
    if (archivedPlayerIds.length === 0) {
      score += 50;
    }

    setRoundScore(Math.max(0, score));

    try {
      await submitAction({
        roomId,
        action: "archive",
        data: String(Math.max(0, score)),
      });
    } catch {
      // continue
    }
  }, [content, hasArchived, selectedSections, decayProgress, archivedPlayerIds, roomId, submitAction]);

  const handleLeaveGame = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveRoom({ roomId });
    } catch {
      // continue redirect even if leave call fails
    }
    router.push("/multiplayer");
  }, [leaving, leaveRoom, roomId, router]);

  if (!content) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center border border-white/10 bg-surface/40">
        <span className="font-mono text-sm text-text-ghost">Loading round content...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2">
        <GlowText as="span" color="cyan" intensity="low" className="font-mono text-sm">
          Round {currentRound}/5
        </GlowText>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveGame}
            disabled={leaving}
            className="inline-flex items-center gap-1.5 border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-decay/40 hover:text-decay disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {leaving ? "Leaving..." : "Leave Game"}
          </button>
          <DecayTimer progress={decayProgress} remaining={Math.round(content.decayDuration * (1 - decayProgress))} />
        </div>
      </div>

      {/* Opponent status */}
      <OpponentStatus
        otherPlayers={otherPlayers}
        archivedPlayerIds={archivedPlayerIds}
        mode="race"
      />

      {/* Game area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 min-h-0 overflow-hidden">
        {/* Page */}
        <div className="overflow-y-auto border border-white/5 bg-surface/50 p-4">
          <DecayingPage
            content={content}
            decayProgress={decayProgress}
            selectedSections={selectedSections}
            onSelectSection={handleSelect}
          />
        </div>

        {/* Tools sidebar */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
          <ToolPanel factCheckData={content.factCheckData} sections={content.sections} decayProgress={decayProgress} />
          <EnergyBar current={archiveEnergy} max={GAME_CONSTANTS.BASE_ARCHIVE_ENERGY} />
          <ArchiveButton
            selectedCount={selectedSections.length}
            onArchive={handleArchive}
            disabled={hasArchived}
          />
          {hasArchived && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center font-mono text-sm text-archive"
            >
              Score: +{roundScore}
              {allOthersArchived
                ? " — Waiting for round results..."
                : ` — Waiting for ${otherPlayers.length - archivedPlayerIds.length} player(s)...`}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
