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
import { PingSystem } from "./ping-system";
import { GlowText } from "@/components/ui/glow-text";
import { useMultiplayerStore } from "@/store/multiplayer-store";
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

interface CoopGameProps {
  roomId: Id<"multiplayerRooms">;
  currentRound: number;
  contentId: string;
  isHost: boolean;
  partners: PlayerInfo[];
  sharedEnergy: number;
  sharedScore: number;
}

export function CoopGame({
  roomId,
  currentRound,
  contentId,
  isHost,
  partners,
  sharedEnergy,
  sharedScore,
}: CoopGameProps) {
  const router = useRouter();
  const { user } = useUser();
  const submitAction = useMutation(api.multiplayer.submitAction);
  const endRound = useMutation(api.multiplayer.endRound);
  const updateEnergy = useMutation(api.multiplayer.updateSharedEnergy);
  const leaveRoom = useMutation(api.multiplayer.leaveRoom);
  const roundActions = useQuery(api.multiplayer.getRoundActions, {
    roomId,
    round: currentRound,
  });

  const { partnerPings, addPartnerPing } = useMultiplayerStore();

  const coopSelections = useQuery(api.multiplayer.getCoopSelections, {
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
  const [localEnergy, setLocalEnergy] = useState(sharedEnergy);
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

  // Sync shared energy from server
  useEffect(() => {
    setLocalEnergy(sharedEnergy);
  }, [sharedEnergy]);

  // Start decay
  useEffect(() => {
    if (!content) return;
    decayEngine.reset();
    decayEngine.start();
    return () => decayEngine.pause();
  }, [currentRound, content?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Derive which partners have archived
  const archivedPlayerIds = useMemo(() => {
    if (!roundActions || !user) return [] as string[];
    return roundActions
      .filter((a: { action: string; clerkId: string }) => a.action === "archive" && a.clerkId !== user.id)
      .map((a: { action: string; clerkId: string }) => a.clerkId);
  }, [roundActions, user]);

  const allPartnersArchived = archivedPlayerIds.length >= partners.length;

  // Handle decay timeout — auto-submit when time runs out
  useEffect(() => {
    if (!decayEngine.isComplete || hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;

    if (hasArchived) return;

    if (selectedSections.length > 0) {
      handleArchive();
    } else {
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
    if (!hasArchived || !allPartnersArchived || roundEndedRef.current) return;
    roundEndedRef.current = true;

    // Sum all players' scores for the combined round score
    let combined = roundScore;
    if (roundActions) {
      for (const partner of partners) {
        const action = roundActions.find(
          (a: { action: string; clerkId: string; data?: string }) => a.action === "archive" && a.clerkId === partner.clerkId
        );
        combined += action?.data ? parseInt(action.data, 10) || 0 : 0;
      }
    }

    endRound({
      roomId,
      sharedScoreAdd: combined,
    });
  }, [hasArchived, allPartnersArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety net: if we archived but partners haven't after 10s, host force-advances
  useEffect(() => {
    if (!hasArchived || allPartnersArchived || !isHost) return;
    safetyTimerRef.current = setTimeout(() => {
      if (roundEndedRef.current) return;
      roundEndedRef.current = true;
      endRound({
        roomId,
        sharedScoreAdd: roundScore,
      });
    }, 10000);
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [hasArchived, allPartnersArchived, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive partner selections from synced data
  const partnerSelections = useMemo(() => {
    if (!coopSelections || !user) return [] as string[];
    return coopSelections
      .filter((s: { sectionId: string; playerId: string }) => s.playerId !== user.id)
      .map((s: { sectionId: string; playerId: string }) => s.sectionId);
  }, [coopSelections, user]);

  const handleSelect = useCallback(
    (sectionId: string) => {
      if (!content || hasArchived) return;
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

      // Sync selection to Convex for partner visibility
      submitAction({
        roomId,
        action: "select",
        data: JSON.stringify({ sectionId, playerId: user?.id }),
      }).catch(() => {});
    },
    [content, hasArchived, selectedSections, localEnergy, roomId, updateEnergy, submitAction, user]
  );

  const handleArchive = useCallback(async () => {
    if (!content || hasArchived || selectedSections.length === 0) return;
    setHasArchived(true);

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
  }, [content, hasArchived, selectedSections, decayProgress, roomId, submitAction]);

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
        <div className="flex items-center gap-4">
          <GlowText as="span" color="green" intensity="low" className="font-mono text-sm">
            Round {currentRound}/5
          </GlowText>
          <span className="font-mono text-sm text-archive">
            Team Score: {sharedScore}
          </span>
        </div>
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

      {/* Partner status */}
      <OpponentStatus
        otherPlayers={partners}
        archivedPlayerIds={archivedPlayerIds}
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
            partnerSelections={partnerSelections}
            onSelectSection={handleSelect}
          />
        </div>

        {/* Tools sidebar */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
          <ToolPanel factCheckData={content.factCheckData} sections={content.sections} decayProgress={decayProgress} />
          <EnergyBar current={localEnergy} max={10} />
          <ArchiveButton
            selectedCount={selectedSections.length}
            onArchive={handleArchive}
            disabled={hasArchived}
          />

          {/* Ping system */}
          <div className="border border-white/5 bg-surface/50 p-2">
            <p className="font-mono text-[10px] text-text-ghost uppercase tracking-wider mb-1">
              Ping Partners
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
              {allPartnersArchived
                ? " — Waiting for round results..."
                : ` — Waiting for ${partners.length - archivedPlayerIds.length} partner(s)...`}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
