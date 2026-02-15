"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import type { PageContent, PageSection } from "@/lib/types";
import { getContentById, getRandomCachedPage } from "@/lib/content/content-cache";
import { useDecayEngine } from "@/lib/decay/decay-engine";
import { GAME_CONSTANTS } from "@/lib/constants";
import { DecayingPage } from "@/components/game/decaying-page";
import { ToolPanel } from "@/components/game/tools/tool-panel";
import { EnergyBar } from "@/components/game/archive/energy-bar";
import { ArchiveButton } from "@/components/game/archive/archive-button";
import { DecayTimer } from "@/components/game/decay-timer";
import { OpponentStatus } from "./opponent-status";
import { GlowText } from "@/components/ui/glow-text";

interface RaceGameProps {
  roomId: Id<"multiplayerRooms">;
  currentRound: number;
  contentId: string;
  isHost: boolean;
  opponentName: string;
  opponentAvatar: string;
}

export function RaceGame({
  roomId,
  currentRound,
  contentId,
  isHost,
  opponentName,
  opponentAvatar,
}: RaceGameProps) {
  const { user } = useUser();
  const submitAction = useMutation(api.multiplayer.submitAction);
  const endRound = useMutation(api.multiplayer.endRound);
  const roundActions = useQuery(api.multiplayer.getRoundActions, {
    roomId,
    round: currentRound,
  });

  const content = useMemo(
    () => getContentById(contentId) ?? getRandomCachedPage([], 3),
    [contentId]
  );

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [archiveEnergy, setArchiveEnergy] = useState<number>(GAME_CONSTANTS.BASE_ARCHIVE_ENERGY);
  const [decayProgress, setDecayProgress] = useState(0);
  const [hasArchived, setHasArchived] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const roundEndedRef = useRef(false);

  const decayEngine = useDecayEngine({
    duration: content.decayDuration,
    onProgress: setDecayProgress,
  });

  // Start decay
  useEffect(() => {
    decayEngine.reset();
    decayEngine.start();
    return () => decayEngine.pause();
  }, [currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if opponent has archived
  const opponentArchived = useMemo(() => {
    if (!roundActions || !user) return false;
    return roundActions.some(
      (a: { action: string; clerkId: string }) => a.action === "archive" && a.clerkId !== user.id
    );
  }, [roundActions, user]);

  // Auto-end round when both have archived
  useEffect(() => {
    if (!hasArchived || !opponentArchived || roundEndedRef.current) return;
    roundEndedRef.current = true;

    // Calculate opponent score from their action data
    const opponentAction = roundActions?.find(
      (a: { action: string; clerkId: string }) => a.action === "archive" && a.clerkId !== user?.id
    );
    const opponentScore = opponentAction?.data
      ? parseInt(opponentAction.data, 10) || 0
      : 0;

    const hostAdd = isHost ? roundScore : opponentScore;
    const guestAdd = isHost ? opponentScore : roundScore;

    endRound({ roomId, hostScoreAdd: hostAdd, guestScoreAdd: guestAdd });
  }, [hasArchived, opponentArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (sectionId: string) => {
      if (hasArchived) return;
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
    [hasArchived, content.sections, selectedSections, archiveEnergy]
  );

  const handleArchive = useCallback(async () => {
    if (hasArchived || selectedSections.length === 0) return;
    setHasArchived(true);
    decayEngine.pause();

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
    if (!opponentArchived) {
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
  }, [hasArchived, selectedSections, content.sections, decayProgress, opponentArchived, roomId, submitAction, decayEngine]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2">
        <GlowText as="span" color="cyan" intensity="low" className="font-mono text-sm">
          Round {currentRound}/5
        </GlowText>
        <DecayTimer progress={decayProgress} remaining={Math.round(content.decayDuration * (1 - decayProgress))} />
      </div>

      {/* Opponent status */}
      <OpponentStatus
        name={opponentName}
        avatarUrl={opponentAvatar}
        hasArchived={opponentArchived}
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
        <div className="flex flex-col gap-3 overflow-y-auto">
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
              {opponentArchived
                ? " — Waiting for round results..."
                : " — Waiting for opponent..."}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
