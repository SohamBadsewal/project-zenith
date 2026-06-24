// sky.ts — assemble a SkyState snapshot from already-computed bodies/stars/
// satellites. Pure function (SCHEMA §1.5). zenithObjectId = highest thing above
// the horizon; countAboveHorizon spans bodies + satellites.

import type {
  SkyState,
  CelestialObject,
  SatelliteState,
  ConstellationFigure,
  ObserverLocation,
} from '@/types';
import { satId } from './satellites';

export interface SkyInputs {
  bodies: CelestialObject[];
  satellites: SatelliteState[];
  constellations?: ConstellationFigure[];
  dataMode?: SkyState['dataMode'];
}

/** Altitude below which we don't bother nominating a "zenith" object. */
const ZENITH_MIN_ALT_DEG = 0;

export function buildSkyState(
  observer: ObserverLocation,
  epochMs: number,
  inputs: SkyInputs,
): SkyState {
  const { bodies, satellites } = inputs;

  let zenithObjectId: string | null = null;
  let zenithAlt = ZENITH_MIN_ALT_DEG;

  for (const b of bodies) {
    if (b.altDeg > zenithAlt) {
      zenithAlt = b.altDeg;
      zenithObjectId = b.id;
    }
  }
  for (const s of satellites) {
    if (s.elevationDeg > zenithAlt) {
      zenithAlt = s.elevationDeg;
      zenithObjectId = satId(s.noradId);
    }
  }

  const countAboveHorizon =
    bodies.filter((b) => b.aboveHorizon).length +
    satellites.filter((s) => s.aboveHorizon).length;

  return {
    observer,
    epochMs,
    bodies,
    constellations: inputs.constellations ?? [],
    satellites,
    zenithObjectId,
    countAboveHorizon,
    dataMode: inputs.dataMode ?? 'live',
  };
}
