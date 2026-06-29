'use client';
import { create } from 'zustand';
import type { ObserverLocation, SimTime, SkyState } from '@/types';
import { nowSimTime, clampScrub } from '@/lib/time';

export type Phase = 'launch' | 'warp' | 'globe' | 'descent' | 'sky';
export type LaunchPhase = 'idle' | 'magnifying' | 'armed' | 'dragging' | 'launched';
export type Status = 'idle' | 'loading' | 'live' | 'offlineData' | 'error';
export type ViewMode = 'static' | 'freeroam' | 'freeview';

export interface ZenithStore {
  phase: Phase;
  launch: LaunchPhase;
  tension: number;
  shuttleRect: DOMRect | null;
  launchedAt: number;
  status: Status;
  observer: ObserverLocation | null;
  pending: ObserverLocation | null;
  time: SimTime;
  selectionId: string | null;
  compareSelectionId: string | null;
  zoomTargetId: string | null;
  compareZoomTargetId: string | null;
  viewMode: ViewMode;
  sky: SkyState | null;
  globeIntro: boolean;
  skipAnimation: boolean;
  setSkipAnimation: (s: boolean) => void;
  mode: 'single' | 'compare';
  compareObserver: ObserverLocation | null;
  setMode: (m: 'single' | 'compare') => void;

  setPhase: (p: Phase) => void;
  beginLaunch: (rect: DOMRect) => void;
  finishMagnify: () => void;
  armDrag: () => void;
  setTension: (t: number) => void;
  releaseDrag: () => void;
  fireLaunch: () => void;
  enterWarp: () => void;
  enterGlobe: () => void;
  finishGlobeIntro: () => void;
  pickLocation: (loc: ObserverLocation) => void;
  confirmLocation: (resolvedPlaceName?: string) => void;
  clearPending: () => void;
  setScrubOffset: (ms: number) => void;
  select: (id: string | null) => void;
  selectCompare: (id: string | null) => void;
  zoomTo: (id: string | null) => void;
  zoomCompare: (id: string | null) => void;
  setViewMode: (m: ViewMode) => void;
  setSky: (s: SkyState) => void;
  setStatus: (s: Status) => void;
  reset: () => void;
}

export const useZenith = create<ZenithStore>((set, get) => ({
  phase: 'launch',
  launch: 'idle',
  tension: 0,
  shuttleRect: null,
  launchedAt: 0,
  status: 'idle',
  observer: null,
  pending: null,
  time: nowSimTime(),
  selectionId: null,
  compareSelectionId: null,
  zoomTargetId: null,
  compareZoomTargetId: null,
  viewMode: 'static',
  sky: null,
  globeIntro: true,
  skipAnimation: false,
  mode: 'single',
  compareObserver: null,

  setSkipAnimation: (skipAnimation) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skip_animation', String(skipAnimation));
    }
    set({ skipAnimation });
  },
  setMode: (mode) => set({ mode, observer: null, compareObserver: null, pending: null, selectionId: null, compareSelectionId: null, zoomTargetId: null, compareZoomTargetId: null }),
  setPhase: (phase) => set({ phase }),
  beginLaunch: (rect) => get().launch === 'idle' && set({ launch: 'magnifying', shuttleRect: rect }),
  finishMagnify: () => get().launch === 'magnifying' && set({ launch: 'armed', shuttleRect: null }),
  armDrag: () => {
    const l = get().launch;
    if (l === 'armed' || l === 'dragging') set({ launch: 'dragging', tension: 0 });
  },
  setTension: (t) => {
    if (get().launch !== 'dragging') return;
    const tension = Math.min(1, Math.max(0, t));
    if (tension >= 0.92) set({ launch: 'launched', tension: 1, launchedAt: performance.now() });
    else set({ tension });
  },
  releaseDrag: () => get().launch === 'dragging' && set({ launch: 'armed', tension: 0 }),
  fireLaunch: () => set({ launch: 'launched', tension: 1, launchedAt: performance.now() }),
  enterWarp: () => set({ phase: 'warp' }),
  enterGlobe: () => set({ phase: 'globe', globeIntro: true }),
  finishGlobeIntro: () => set({ globeIntro: false }),
  pickLocation: (pending) => set({ pending }),
  confirmLocation: (resolvedPlaceName) =>
    set((s) => {
      if (!s.pending) return {};
      const finalLoc = { ...s.pending, placeName: resolvedPlaceName ?? s.pending.placeName };
      if (s.mode === 'single') {
        return { observer: finalLoc, pending: null, phase: 'descent' };
      } else {
        if (!s.observer) {
          return { observer: finalLoc, pending: null };
        } else {
          return { compareObserver: finalLoc, pending: null, phase: 'descent' };
        }
      }
    }),
  clearPending: () => set({ observer: null, compareObserver: null, pending: null }),
  setScrubOffset: (ms) => set((s) => ({ time: { ...s.time, scrubOffsetMs: clampScrub(ms) } })),
  select: (selectionId) => set({ selectionId }),
  selectCompare: (compareSelectionId) => set({ compareSelectionId }),
  zoomTo: (zoomTargetId) => set({ zoomTargetId }),
  zoomCompare: (compareZoomTargetId) => set({ compareZoomTargetId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSky: (sky) => set({ sky }),
  setStatus: (status) => set({ status }),
  reset: () =>
    set({
      phase: 'launch',
      launch: 'idle',
      tension: 0,
      shuttleRect: null,
      launchedAt: 0,
      status: 'idle',
      observer: null,
      compareObserver: null,
      pending: null,
      selectionId: null,
      compareSelectionId: null,
      zoomTargetId: null,
      compareZoomTargetId: null,
      viewMode: 'static',
      sky: null,
      globeIntro: true,
      time: nowSimTime(),
      mode: 'single',
    }),
}));
