"use client";

import { create } from "zustand";

interface PingMessage {
  emoji: string;
  timestamp: number;
}

interface MultiplayerState {
  partnerPings: PingMessage[];

  // Actions
  addPartnerPing: (emoji: string) => void;
  clearPings: () => void;
  reset: () => void;
}

const initialState = {
  partnerPings: [] as PingMessage[],
};

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  ...initialState,

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
