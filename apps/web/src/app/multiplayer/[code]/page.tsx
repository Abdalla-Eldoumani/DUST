"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@DUST/backend/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { ParticleField } from "@/components/ui/particle-field";
import { Skeleton } from "@/components/ui/skeleton";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { RoomWaiting } from "@/components/game/multiplayer/room-waiting";
import { RoomLobby } from "@/components/game/multiplayer/room-lobby";
import { RaceGame } from "@/components/game/multiplayer/race-game";
import { CoopGame } from "@/components/game/multiplayer/coop-game";
import { RoundResults } from "@/components/game/multiplayer/round-results";
import { MatchResults } from "@/components/game/multiplayer/match-results";

export default function MultiplayerRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const room = useQuery(api.multiplayer.getRoom, { roomCode: code.toUpperCase() });
  const setPresence = useMutation(api.multiplayer.setPresence);
  const claimWinByAbandonment = useMutation(api.multiplayer.claimWinByAbandonment);
  const [leaveCountdown, setLeaveCountdown] = useState<number | null>(null);
  const claimTriggeredRef = useRef(false);

  // Lock body scroll during gameplay
  useEffect(() => {
    if (room?.status === "playing") {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [room?.status]);

  // Redirect to rematch room when it's created
  useEffect(() => {
    if (
      room &&
      room.status === "finished" &&
      room.rematchRoomCode &&
      room.rematchRoomCode !== code.toUpperCase()
    ) {
      router.push(`/multiplayer/${room.rematchRoomCode}`);
    }
  }, [room?.status, room?.rematchRoomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const isHost = useMemo(
    () => room?.hostClerkId === user?.id,
    [room?.hostClerkId, user?.id]
  );

  const opponentName = isHost
    ? room?.guestUsername ?? "Opponent"
    : room?.hostUsername ?? "Host";
  const opponentAvatar = isHost
    ? room?.guestAvatarUrl ?? ""
    : room?.hostAvatarUrl ?? "";

  const opponentPresent = isHost
    ? room?.guestPresent !== false
    : room?.hostPresent !== false;
  const inActiveRound = room?.status === "playing" || room?.status === "roundEnd";
  const showOpponentLeftNotice = Boolean(
    room &&
    inActiveRound &&
    room.guestClerkId &&
    !opponentPresent
  );
  const shouldRunReconnectCountdown = Boolean(
    room &&
    room.mode === "race" &&
    inActiveRound &&
    room.guestClerkId &&
    !opponentPresent
  );

  // Track presence for active room lifecycle (not only post-game).
  useEffect(() => {
    if (!room || !user) return;
    const roomId = room._id;
    const markAbsent = () => {
      setPresence({ roomId, present: false }).catch(() => {});
    };

    setPresence({ roomId, present: true }).catch(() => {});
    window.addEventListener("beforeunload", markAbsent);
    window.addEventListener("pagehide", markAbsent);

    return () => {
      window.removeEventListener("beforeunload", markAbsent);
      window.removeEventListener("pagehide", markAbsent);
      markAbsent();
    };
  }, [room?._id, user?.id, setPresence]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect grace period: 10 seconds before default win claim.
  useEffect(() => {
    if (!shouldRunReconnectCountdown) {
      setLeaveCountdown(null);
      claimTriggeredRef.current = false;
      return;
    }

    setLeaveCountdown(10);
    const interval = setInterval(() => {
      setLeaveCountdown((prev) => {
        if (prev === null) return null;
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldRunReconnectCountdown]);

  useEffect(() => {
    if (!room || !shouldRunReconnectCountdown) return;
    if (leaveCountdown !== 0 || claimTriggeredRef.current) return;
    claimTriggeredRef.current = true;
    claimWinByAbandonment({ roomId: room._id }).catch(() => {
      claimTriggeredRef.current = false;
    });
  }, [leaveCountdown, shouldRunReconnectCountdown, room?._id, claimWinByAbandonment]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading
  if (room === undefined) {
    return (
      <div className="relative min-h-svh bg-void">
        <ScanlineOverlay />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 bg-elevated/50" />
            <Skeleton className="h-64 w-full bg-elevated/50" />
          </div>
        </div>
      </div>
    );
  }

  // Room not found
  if (room === null) {
    return (
      <div className="relative min-h-svh bg-void">
        <ScanlineOverlay />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-svh px-4">
          <TerminalPanel title="ERROR" glowColor="red">
            <div className="p-8 text-center space-y-4">
              <AlertTriangle className="mx-auto h-8 w-8 text-decay" />
              <p className="font-mono text-sm text-text-primary">
                Room <span className="text-scan">{code.toUpperCase()}</span> not found
              </p>
              <p className="font-sans text-xs text-text-ghost">
                The room may have expired or the code may be incorrect.
              </p>
              <Link
                href="/multiplayer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-scan hover:text-scan/80 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Lobby
              </Link>
            </div>
          </TerminalPanel>
        </div>
      </div>
    );
  }

  // Render based on room status
  return (
    <div className={`relative bg-void ${room.status === "playing" ? "h-svh overflow-hidden" : "min-h-svh"}`}>
      {room.status !== "playing" && <ParticleField particleCount={30} />}
      {room.status !== "playing" && <ScanlineOverlay />}

      <div className={`relative z-10 mx-auto max-w-5xl px-4 py-4 flex flex-col ${room.status === "playing" ? "h-full" : "min-h-svh"}`}>
        {/* Header (only in non-playing states) */}
        {room.status !== "playing" && (
          <div className="mb-4">
            <Link
              href="/multiplayer"
              className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-secondary transition-colors font-sans"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Lobby
            </Link>
          </div>
        )}

        {/* Room content */}
        <div className="flex-1 min-h-0">
          {showOpponentLeftNotice && room.status !== "finished" && (
            <div className="mb-3 border border-decay/40 bg-decay/10 px-3 py-2">
              <p className="font-mono text-xs uppercase tracking-wider text-decay">
                {opponentName} left.
              </p>
              <p className="mt-1 font-sans text-xs text-text-secondary">
                {room.mode === "race"
                  ? `Waiting ${leaveCountdown ?? 10}s for reconnect. If they don't return, you win by default.`
                  : "You can keep playing. They can rejoin at any time."}
              </p>
            </div>
          )}

          {room.status === "waiting" && (
            <RoomWaiting
              roomCode={room.roomCode}
              roomId={room._id}
              hostUsername={room.hostUsername}
              hostAvatarUrl={room.hostAvatarUrl}
              mode={room.mode}
            />
          )}

          {room.status === "ready" && (
            <RoomLobby
              roomId={room._id}
              roomCode={room.roomCode}
              mode={room.mode}
              isHost={isHost}
              hostUsername={room.hostUsername}
              hostAvatarUrl={room.hostAvatarUrl}
              guestUsername={room.guestUsername ?? "Guest"}
              guestAvatarUrl={room.guestAvatarUrl ?? ""}
            />
          )}

          {room.status === "playing" && room.currentContentId && (
            room.mode === "race" ? (
              <RaceGame
                roomId={room._id}
                currentRound={room.currentRound}
                contentId={room.currentContentId}
                isHost={isHost}
                opponentName={opponentName}
                opponentAvatar={opponentAvatar}
              />
            ) : (
              <CoopGame
                roomId={room._id}
                currentRound={room.currentRound}
                contentId={room.currentContentId}
                isHost={isHost}
                partnerName={opponentName}
                partnerAvatar={opponentAvatar}
                sharedEnergy={room.sharedEnergy ?? 10}
                sharedScore={room.sharedScore ?? 0}
              />
            )
          )}

          {room.status === "roundEnd" && (
            <RoundResults
              roomId={room._id}
              currentRound={room.currentRound}
              maxRounds={room.maxRounds}
              mode={room.mode}
              isHost={isHost}
              hostUsername={room.hostUsername}
              guestUsername={room.guestUsername ?? "Guest"}
              hostScore={room.hostScore}
              guestScore={room.guestScore}
              sharedScore={room.sharedScore ?? undefined}
            />
          )}

          {room.status === "finished" && (
            <MatchResults
              roomId={room._id}
              mode={room.mode}
              currentRound={room.currentRound}
              hostUsername={room.hostUsername}
              guestUsername={room.guestUsername ?? "Guest"}
              hostAvatarUrl={room.hostAvatarUrl}
              guestAvatarUrl={room.guestAvatarUrl ?? ""}
              hostScore={room.hostScore}
              guestScore={room.guestScore}
              sharedScore={room.sharedScore ?? undefined}
              maxRounds={room.maxRounds}
              isHost={isHost}
              hostPresent={room.hostPresent}
              guestPresent={room.guestPresent}
              opponentPresent={
                isHost
                  ? room.guestPresent ?? false
                  : room.hostPresent ?? false
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
