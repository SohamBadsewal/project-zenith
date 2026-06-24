// time.ts — simTime is the master input. Every position is a pure function of
// (observer, effectiveEpochMs). See SCHEMA §1.2.

import type { SimTime } from '@/types';

export const HOUR_MS = 3_600_000;
export const SCRUB_RANGE_MS = 6 * HOUR_MS; // ±6h scrubber window

export function effectiveEpochMs(t: SimTime): number {
  return t.liveEpochMs + t.scrubOffsetMs;
}

export function nowSimTime(): SimTime {
  return { liveEpochMs: Date.now(), scrubOffsetMs: 0 };
}

export function clampScrub(ms: number): number {
  return Math.max(-SCRUB_RANGE_MS, Math.min(SCRUB_RANGE_MS, ms));
}
