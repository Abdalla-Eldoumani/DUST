"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";
import type { PageContent } from "@/lib/types";
import { getContentById, getRandomCachedPage } from "@/lib/content/content-cache";
import { useDecayEngine } from "@/lib/decay/decay-engine";
import { GAME_CONSTANTS } from "@/lib/constants";
import { DecayingPage } from "@/components/game/decaying-page";
import { ToolPanel } from "@/components/game/tools/tool-panel";
import { EnergyBar } from "@/components/game/archive/energy-bar";
import { ArchiveButton } from "@/components/game/archive/archive-button";
import { DecayTimer } from "@/components/game/decay-timer";
import { OpponentStatus } from "./opponent-status";
import { PingSystem } from "./ping-system";
import { GlowText } from "@/components/ui/glow-text";
import { useMultiplayerStore } from "@/store/multiplayer-store";

interface CoopGameProps {
  roomId: Id<"multiplayerRooms">;
  currentRound: number;
  contentId: string;
  isHost: boolean;
  partnerName: string;
  partnerAvatar: string;
  sharedEnergy: number;
  sharedScore: number;
}

export function CoopGame({
  roomId,
  currentRound,
  contentId,
  isHost,
  partnerName,
  partnerAvatar,
  sharedEnergy,
  sharedScore,
}: CoopGameProps) {
  const { user } = useUser();
  const submitAction = useMutation(api.multiplayer.submitAction);
  const endRound = useMutation(api.multiplayer.endRound);
  const updateEnergy = useMutation(api.multiplayer.updateSharedEnergy);
  const roundActions = useQuery(api.multiplayer.getRoundActions, {
    roomId,
    round: currentRound,
  });

  const { partnerPings, addPartnerPing } = useMultiplayerStore();

  const content = useMemo(
    () => getContentById(contentId) ?? getRandomCachedPage([], 3),
    [contentId]
  );

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [localEnergy, setLocalEnergy] = useState(sharedEnergy);
  const [decayProgress, setDecayProgress] = useState(0);
  const [hasArchived, setHasArchived] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const roundEndedRef = useRef(false);

  const decayEngine = useDecayEngine({
    duration: content.decayDuration,
    onProgress: setDecayProgress,
  });

  // Sync shared energy from server
  useEffect(() => {
    setLocalEnergy(sharedEnergy);
  }, [sharedEnergy]);

  // Start decay
  useEffect(() => {
    decayEngine.reset();
    decayEngine.start();
    return () => decayEngine.pause();
  }, [currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for partner pings
  useEffect(() => {
    if (!roundActions || !user) return;
    const pings = roundActions.filter(
      (a: { action: string; clerkId: string; data?: string }) => a.action === "ping" && a.clerkId !== user.id
    );
    for (const ping of pings) {
      if (ping.data) {
        addPartnerPing(ping.data);
      }
    }
  }, [roundActions?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if partner has archived
  const partnerArchived = useMemo(() => {
    if (!roundActions || !user) return false;
    return roundActions.some(
      (a: { action: string; clerkId: string }) => a.action === "archive" && a.clerkId !== user.id
    );
  }, [roundActions, user]);

  // Auto-end round when both have archived
  useEffect(() => {
    if (!hasArchived || !partnerArchived || roundEndedRef.current) return;
    roundEndedRef.current = true;

    const partnerAction = roundActions?.find(
      (a: { action: string; clerkId: string; data?: string }) => a.action === "archive" && a.clerkId !== user?.id
    );
    const partnerScore = partnerAction?.data
      ? parseInt(partnerAction.data, 10) || 0
      : 0;

    const combined = roundScore + partnerScore;
    endRound({
      roomId,
      hostScoreAdd: 0,
      guestScoreAdd: 0,
      sharedScoreAdd: combined,
    });
  }, [hasArchived, partnerArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (sectionId: string) => {
      if (hasArchived) return;
      const section = content.sections.find((s) => s.id === sectionId);
      if (!section) return;

      if (selectedSections.includes(sectionId)) {
        setSelectedSections((prev) => prev.filter((id) => id !== sectionId));
        const newEnergy = localEnergy + section.archiveCost;
        setLocalEnergy(newEnergy);
        updateEnergy({ roomId, energy: newEnergy });
      } else {
        if (localEnergy < section.archiveCost) return;
        setSelectedSections((prev) => [...prev, sectionId]);
        const newEnergy = localEnergy - section.archiveCost;
        setLocalEnergy(newEnergy);
        updateEnergy({ roomId, energy: newEnergy });
      }
    },
    [hasArchived, content.sections, selectedSections, localEnergy, roomId, updateEnergy]
  );

  const handleArchive = useCallback(async () => {
    if (hasArchived || selectedSections.length === 0) return;
    setHasArchived(true);
    decayEngine.pause();

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
  }, [hasArchived, selectedSections, content.sections, decayProgress, roomId, submitAction, decayEngine]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <GlowText as="span" color="green" intensity="low" className="font-mono text-sm">
            Round {currentRound}/5
          </GlowText>
          <span className="font-mono text-sm text-archive">
            Team Score: {sharedScore}
          </span>
        </div>
        <DecayTimer progress={decayProgress} remaining={Math.round(content.decayDuration * (1 - decayProgress))} />
      </div>

      {/* Partner status */}
      <OpponentStatus
        name={partnerName}
        avatarUrl={partnerAvatar}
        hasArchived={partnerArchived}
        mode="coop"
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
          <ToolPanel factCheckData={content.factCheckData} decayProgress={decayProgress} />
          <EnergyBar current={localEnergy} max={10} />
          <ArchiveButton
            selectedCount={selectedSections.length}
            onArchive={handleArchive}
            disabled={hasArchived}
          />

          {/* Ping system */}
          <div className="border border-white/5 bg-surface/50 p-2">
            <p className="font-mono text-[10px] text-text-ghost uppercase tracking-wider mb-1">
              Ping Partner
            </p>
            <PingSystem roomId={roomId} partnerPings={partnerPings} />
          </div>

          {hasArchived && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center font-mono text-sm text-archive"
            >
              Your score: +{roundScore}
              {partnerArchived
                ? " — Waiting for round results..."
                : " — Waiting for partner..."}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
