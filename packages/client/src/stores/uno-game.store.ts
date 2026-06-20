// ──────────────────────────────────────────────
// Zustand Store: Turn-Game Board (UNO and future turn-based games)
// ──────────────────────────────────────────────
// Holds the live, per-viewer board snapshot pushed by the server (uno_state_patch
// SSE) or fetched on mount. chatId-guarded so a background chat's game can never
// paint over the visible board. Synchronous only — all async lives in use-uno.ts.
import { create } from "zustand";
import type { UnoPublicView } from "@marinara-engine/shared";

export type UnoBoardSnapshot = UnoPublicView & { chatId: string };

interface UnoGameStore {
  current: UnoBoardSnapshot | null;
  /** Replace the board with a fresh server snapshot for a chat. */
  setUno: (view: UnoPublicView, chatId: string) => void;
  /** Clear the board (optionally only if it belongs to a given chat). */
  clearUno: (chatId?: string) => void;
  reset: () => void;
}

export const useUnoGameStore = create<UnoGameStore>((set) => ({
  current: null,
  setUno: (view, chatId) => set({ current: { ...view, chatId } }),
  clearUno: (chatId) =>
    set((state) => (!chatId || state.current?.chatId === chatId ? { current: null } : {})),
  reset: () => set({ current: null }),
}));
