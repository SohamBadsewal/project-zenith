'use client';

import { useEffect, useRef, useState } from 'react';
import { useZenith } from '@/store/useZenith';
import { effectiveEpochMs } from '@/lib/time';
import { computeBodies, computeStars, raDecToAltAz } from '@/lib/ephemeris';
import { propagateAll, propagateSatellite, satId } from '@/lib/satellites';

const ISS_NORAD = 25544;
const ORBIT_STEP_MS = 2 * 60 * 1000; // 2-minute steps
const ORBIT_STEPS = 45; // covers ~90 min (one orbit)

function computeIssOrbit(
  issTle: SatelliteTLE,
  observer: ObserverLocation,
  startDate: Date,
): IssOrbitPoint[] {
  const pts: IssOrbitPoint[] = [];
  for (let i = 0; i <= ORBIT_STEPS; i++) {
    const d = new Date(startDate.getTime() + i * ORBIT_STEP_MS);
    const s = propagateSatellite(issTle, observer, d);
    if (s) pts.push({ altDeg: s.elevationDeg, azDeg: s.azDeg, minsFromNow: (i * ORBIT_STEP_MS) / 60000 });
  }
  return pts;
}
import { buildSkyState } from '@/lib/sky';
import type {
  CelestialObject,
  SatelliteState,
  SatelliteTLE,
  ConstellationFigure,
  CelestrakResponse,
  ObserverLocation,
} from '@/types';
import bsc5 from '@/data/bsc5.json';
import constellationData from '@/data/constellations.json';

const STARS = bsc5 as Array<{ hr: number; name?: string; raDeg: number; decDeg: number; mag: number; bv?: number }>;
const CONSTELLATIONS = constellationData as ConstellationFigure[];

const SAT_TICK_MS = 1000; // satellites + bodies recompute cadence
const STAR_TICK_MS = 15000; // stars recompute cadence (they drift slowly)
const MAX_SATS = 220; // perf cap on rendered satellites

/** A constellation with its line points projected to [altDeg, azDeg]. */
export interface ProjectedConstellation {
  id: string;
  name: string;
  paths: Array<Array<[number, number]>>; // [altDeg, azDeg] per point
}

/** Alt/Az waypoints for the ISS over the next ~90 min (one orbit). */
export type IssOrbitPoint = { altDeg: number; azDeg: number; minsFromNow: number };

export interface SkyData {
  bodies: CelestialObject[];
  stars: CelestialObject[];
  satellites: SatelliteState[];
  constellations: ProjectedConstellation[];
  zenithObjectId: string | null;
  countAboveHorizon: number;
  dataMode: 'live' | 'offline' | 'mixed';
  issOrbit: IssOrbitPoint[];
}

const EMPTY: SkyData = {
  bodies: [],
  stars: [],
  satellites: [],
  constellations: [],
  zenithObjectId: null,
  countAboveHorizon: 0,
  dataMode: 'offline',
  issOrbit: [],
};

function projectConstellations(
  observer: ObserverLocation,
  date: Date,
): ProjectedConstellation[] {
  return CONSTELLATIONS.map((c) => ({
    id: c.id,
    name: c.name,
    paths: c.paths.map((line) =>
      line.map(([raDeg, decDeg]) => {
        const { altDeg, azDeg } = raDecToAltAz(raDeg, decDeg, observer, date);
        return [altDeg, azDeg] as [number, number];
      }),
    ),
  }));
}

function scheduleIdle(cb: () => void): number {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(cb, { timeout: 1200 }) as unknown as number;
  }
  return setTimeout(cb, 0) as unknown as number;
}

function cancelIdle(h: number): void {
  if (typeof cancelIdleCallback === 'function') cancelIdleCallback(h);
  else clearTimeout(h);
}

export function useSky(): SkyData {
  const observer = useZenith((s) => s.observer);
  const time = useZenith((s) => s.time);
  const setSky = useZenith((s) => s.setSky);
  const setStatus = useZenith((s) => s.setStatus);

  const [data, setData] = useState<SkyData>(EMPTY);
  const tlesRef = useRef<SatelliteTLE[]>([]);
  const dataModeRef = useRef<'live' | 'offline'>('offline');
  const prevElev = useRef<Map<number, number>>(new Map());
  const starsRef = useRef<CelestialObject[]>([]);
  const constellationsRef = useRef<ProjectedConstellation[]>([]);
  const lastStarCompute = useRef(0);
  const starPending = useRef(false);

  // Fetch TLEs once the observer is confirmed.
  useEffect(() => {
    if (!observer) return;
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const groups = await Promise.all([
          fetch('/api/celestrak?group=stations').then((r) => r.json() as Promise<CelestrakResponse>),
          fetch('/api/celestrak?group=visual').then((r) => r.json() as Promise<CelestrakResponse>),
        ]);
        if (cancelled) return;
        const byId = new Map<number, SatelliteTLE>();
        for (const g of groups) for (const t of g.tles ?? []) byId.set(t.noradId, t);
        tlesRef.current = [...byId.values()];
        dataModeRef.current = tlesRef.current.length > 0 ? 'live' : 'offline';
      } catch {
        dataModeRef.current = 'offline';
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [observer, setStatus]);

  useEffect(() => {
    if (!observer) {
      setData(EMPTY);
      return;
    }
    let cancelled = false;
    let idleHandle: number | null = null;

    const scheduleStars = (obs: ObserverLocation) => {
      if (starPending.current) return;
      starPending.current = true;
      idleHandle = scheduleIdle(() => {
        starPending.current = false;
        if (cancelled) return;
        const d = new Date(effectiveEpochMs(useZenith.getState().time));
        starsRef.current = computeStars(STARS, obs, d);
        constellationsRef.current = projectConstellations(obs, d);
        lastStarCompute.current = Date.now();
        setData((prev) => ({
          ...prev,
          stars: starsRef.current,
          constellations: constellationsRef.current,
        }));
      });
    };

    const recompute = () => {
      const obs: ObserverLocation = observer;
      const date = new Date(effectiveEpochMs(useZenith.getState().time));

      const bodies = computeBodies(obs, date);

      if (Date.now() - lastStarCompute.current > STAR_TICK_MS || starsRef.current.length === 0) {
        scheduleStars(obs);
      }

      let satellites = propagateAll(tlesRef.current, obs, date, prevElev.current);
      prevElev.current = new Map(satellites.map((s) => [s.noradId, s.elevationDeg]));
      satellites = satellites
        .filter((s) => s.aboveHorizon || s.name.includes('ISS'))
        .sort((a, b) => b.elevationDeg - a.elevationDeg)
        .slice(0, MAX_SATS);

      const sky = buildSkyState(obs, date.getTime(), {
        bodies,
        satellites,
        constellations: CONSTELLATIONS,
        dataMode: dataModeRef.current,
      });

      const issTle = tlesRef.current.find((t) => t.noradId === ISS_NORAD);
      const issOrbit = issTle ? computeIssOrbit(issTle, obs, date) : [];

      setData((prev) => ({
        ...prev,
        bodies,
        stars: starsRef.current,
        satellites,
        constellations: constellationsRef.current,
        zenithObjectId: sky.zenithObjectId,
        countAboveHorizon: sky.countAboveHorizon,
        dataMode: dataModeRef.current,
        issOrbit,
      }));
      setSky(sky);
      setStatus(dataModeRef.current === 'live' ? 'live' : 'offlineData');
    };

    recompute();
    const id = setInterval(recompute, SAT_TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (idleHandle != null) cancelIdle(idleHandle);
    };
  }, [observer, time.scrubOffsetMs, setSky, setStatus]);

  return data;
}

export { satId };
