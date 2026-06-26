// useZenith.ts — single typed global store (SCHEMA §4).
import { create } from 'zustand';
import type { ObserverLocation, SimTime, SkyState } from '@/types';
import { nowSimTime, clampScrub } from '@/lib/time';

export type Phase = 'landing' | 'warp' | 'globe' | 'descent' | 'sky';
export type Status = 'idle' | 'loading' | 'live' | 'offlineData' | 'error';
export type ViewMode = 'static' | 'freeroam';

export interface ZenithStore {
  phase: Phase;
  status: Status;
  observer: ObserverLocation | null; // null until a point is confirmed
  pending: ObserverLocation | null; // picked but not yet confirmed (drives the card)
  time: SimTime;
  selectionId: string | null; // highlighted object in the sky view
  viewMode: ViewMode;
  sky: SkyState | null;

  setPhase: (p: Phase) => void;
  pickLocation: (loc: ObserverLocation) => void; // sets pending, opens card
  confirmLocation: () => void; // pending -> observer, -> descent
  clearPending: () => void;
  setScrubOffset: (ms: number) => void;
  select: (id: string | null) => void;
  setViewMode: (m: ViewMode) => void;
  setSky: (s: SkyState) => void;
  setStatus: (s: Status) => void;
  reset: () => void;
}

export const useZenith = create<ZenithStore>((set) => ({
  phase: 'landing',
  status: 'idle',
  observer: null,
  pending: null,
  time: nowSimTime(),
  selectionId: null,
  viewMode: 'freeroam',
  sky: null,

  setPhase: (phase) => set({ phase }),
  pickLocation: (pending) => set({ pending }),
  confirmLocation: () =>
    set((s) =>
      s.pending
        ? { observer: s.pending, pending: null, phase: 'descent' }
        : {},
    ),
  clearPending: () => set({ pending: null }),
  setScrubOffset: (ms) =>
    set((s) => ({ time: { ...s.time, scrubOffsetMs: clampScrub(ms) } })),
  select: (selectionId) => set({ selectionId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSky: (sky) => set({ sky }),
  setStatus: (status) => set({ status }),
  reset: () =>
    set({
      phase: 'landing',
      status: 'idle',
      observer: null,
      pending: null,
      selectionId: null,
      viewMode: 'freeroam',
      sky: null,
      time: nowSimTime(),
    }),
}));
