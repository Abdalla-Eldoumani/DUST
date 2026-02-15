"use client";

import { create } from "zustand";
import type { Id } from "@DUST/backend/convex/_generated/dataModel";

interface PingMessage {
  emoji: string;
  timestamp: number;
}

interface MultiplayerState {
  roomCode: string | null;
  roomId: Id<"multiplayerRooms"> | null;
  mode: "race" | "coop" | null;
  isHost: boolean;
  opponentName: string | null;
  opponentAvatar: string | null;
  myRoundScore: number;
  opponentHasArchived: boolean;
  partnerPings: PingMessage[];

  // Actions
  setRoom: (roomCode: string, roomId: Id<"multiplayerRooms">, mode: "race" | "coop", isHost: boolean) => void;
  setOpponent: (name: string, avatar: string) => void;
  setOpponentArchived: (archived: boolean) => void;
  setMyRoundScore: (score: number) => void;
  addPartnerPing: (emoji: string) => void;
  clearPings: () => void;
  reset: () => void;
}

const initialState = {
  roomCode: null as string | null,
  roomId: null as Id<"multiplayerRooms"> | null,
  mode: null as "race" | "coop" | null,
  isHost: false,
  opponentName: null as string | null,
  opponentAvatar: null as string | null,
  myRoundScore: 0,
  opponentHasArchived: false,
  partnerPings: [] as PingMessage[],
};

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  ...initialState,

  setRoom: (roomCode, roomId, mode, isHost) =>
    set({ roomCode, roomId, mode, isHost }),

  setOpponent: (name, avatar) =>
    set({ opponentName: name, opponentAvatar: avatar }),

  setOpponentArchived: (archived) =>
    set({ opponentHasArchived: archived }),

  setMyRoundScore: (score) =>
    set({ myRoundScore: score }),

  addPartnerPing: (emoji) =>
    set((state) => ({
      partnerPings: [
        ...state.partnerPings.slice(-4),
        { emoji, timestamp: Date.now() },
      ],
    })),

  clearPings: () => set({ partnerPings: [] }),

  reset: () => set(initialState),
}));
