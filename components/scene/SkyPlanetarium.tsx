'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Line } from '@react-three/drei';
import * as THREE from 'three';
import { altAzToVec3, circlePoints } from '@/lib/dome';
import { raDecToAltAz } from '@/lib/ephemeris';
import { satId, type SkyData, type IssOrbitPoint } from '@/hooks/useSky';
import type { CelestialObject, SatelliteState, ObserverLocation } from '@/types';
import { InstancedStars } from './InstancedStars';
import { SatModel } from './SatModel';
import { PlanetModel } from './PlanetModel';
import { Constellations } from './Constellations';
import { ConstellationArt } from './ConstellationArt';
import { Trajectory } from './Trajectory';
import { DeepSkyObjects } from './DeepSkyObjects';
import { bodyTrajectory, satTrajectory, type TrajectoryPoint } from '@/lib/trajectory';
import { DSOS } from '@/hooks/useSky';
import { effectiveEpochMs } from '@/lib/time';
import { useZenith } from '@/store/useZenith';

const DOME_R = 5;
const OBJ_NEAR = Math.cos((6 * Math.PI) / 180);
const CON_NEAR = Math.cos((22 * Math.PI) / 180);

export interface Layers {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  satellites: boolean;
  labels: boolean;
}

export interface FocusInfo {
  id: string;
  name: string;
  subtitle: string;
  blurb?: string;
}

const KIND_LABEL: Record<string, string> = { sun: 'Star · our Sun', moon: 'Moon', planet: 'Planet', star: 'Star' };
const DSO_LABEL: Record<string, string> = {
  spiral: 'Spiral galaxy', elliptical: 'Elliptical galaxy', irregular: 'Galaxy',
  globular: 'Globular cluster', cluster: 'Open cluster', nebula: 'Nebula',
};
const ISS_NORAD = 25544;
const HST_NORAD = 20580;
const isIssSat = (s: SatelliteState) => s.noradId === ISS_NORAD || s.name.includes('ISS');
const isHstSat = (s: SatelliteState) => s.noradId === HST_NORAD || /HST|HUBBLE/i.test(s.name);

/** Exactly one ISS and one Hubble, preferring their canonical NORAD ids. Guards
 *  against catalogue duplicates (the ISS appears in several CelesTrak groups). */
function pickHeroSats(all: SatelliteState[]): SatelliteState[] {
  const iss = all.find((s) => s.noradId === ISS_NORAD) ?? all.find(isIssSat);
  const hst = all.find((s) => s.noradId === HST_NORAD) ?? all.find(isHstSat);
  return [iss, hst].filter((s): s is SatelliteState => Boolean(s));
}

type Cand = { id: string; vec: THREE.Vector3; info: FocusInfo };

export function SkyPlanetarium({
  data,
  layers,
  selectionId,
  onSelect,
  onFocus,
  observerOverride,
}: {
  data: SkyData;
  layers: Layers;
  selectionId: string | null;
  onSelect: (id: string | null) => void;
  onFocus: (info: FocusInfo | null) => void;
  observerOverride?: ObserverLocation | null;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);

  // Clear stale focus when the focused object's layer gets toggled off.
  useEffect(() => {
    if (!focusId) return;
    if (focusId.startsWith('star:') && !layers.stars) { setFocusId(null); onFocus(null); }
    if (focusId.startsWith('dso:') && !layers.stars) { setFocusId(null); onFocus(null); }
    if (focusId.startsWith('con:') && !layers.constellations) { setFocusId(null); onFocus(null); }
    if ((focusId.startsWith('planet:') || focusId === 'sun' || focusId === 'moon') && !layers.planets) { setFocusId(null); onFocus(null); }
    if (focusId.startsWith('sat:') && !layers.satellites) { setFocusId(null); onFocus(null); }
  }, [focusId, layers, onFocus]);
  const starSelection = selectionId?.startsWith('star:') ? selectionId : null;
  const sats = useMemo(() => pickHeroSats(data.satellites), [data.satellites]);

  // Observer + effective time — must be declared before any memo that uses them.
  const storeObserver = useZenith((s) => s.observer);
  const observer = observerOverride !== undefined ? observerOverride : storeObserver;
  const dateMs = effectiveEpochMs(useZenith((s) => s.time));

  const objCands = useMemo<Cand[]>(() => {
    const out: Cand[] = [];
    const v = (alt: number, az: number) => {
      const [x, y, z] = altAzToVec3(alt, az, 1);
      return new THREE.Vector3(x, y, z);
    };
    if (layers.planets)
      for (const b of data.bodies)
        out.push({ id: b.id, vec: v(b.altDeg, b.azDeg), info: { id: b.id, name: b.name, subtitle: KIND_LABEL[b.kind] ?? 'Body', blurb: bodyLines(b) } });
    if (layers.stars)
      for (const s of data.stars)
        out.push({ id: s.id, vec: v(s.altDeg, s.azDeg), info: { id: s.id, name: s.name, subtitle: s.con ? `Star in ${s.con}` : 'Star', blurb: starLines(s) } });
    if (layers.satellites)
      for (const s of sats) {
        const id = satId(s.noradId);
        out.push({ id, vec: v(s.elevationDeg, s.azDeg), info: { id, name: cleanSat(s.name), subtitle: isHstSat(s) ? 'Space telescope' : 'Satellite', blurb: satLines(s) } });
      }
    if (layers.stars && observer) {
      const date = new Date(dateMs);
      for (const d of DSOS) {
        const { altDeg, azDeg } = raDecToAltAz(d.raDeg, d.decDeg, observer, date);
        if (altDeg <= 0) continue;
        const [x, y, z] = altAzToVec3(altDeg, azDeg, 1);
        const id = `dso:${d.id}`;
        out.push({ id, vec: new THREE.Vector3(x, y, z), info: { id, name: d.name, subtitle: DSO_LABEL[d.type] ?? 'Deep-sky object', blurb: d.fact } });
      }
    }
    return out;
  }, [data.bodies, data.stars, sats, layers, observer, dateMs]);

  const conCands = useMemo<Cand[]>(() => {
    const blurbs = new Map(data.art.map((a) => [a.id, a.blurb]));
    return data.constellations
      .map((c) => {
        const dir = new THREE.Vector3();
        let n = 0;
        for (const path of c.paths)
          for (const [alt, az] of path) {
            const [x, y, z] = altAzToVec3(alt, az, 1);
            dir.add(new THREE.Vector3(x, y, z));
            n++;
          }
        if (!n) return null;
        return { id: c.id, vec: dir.normalize(), info: { id: `con:${c.id}`, name: c.name, subtitle: 'Constellation', blurb: blurbs.get(c.id) } };
      })
      .filter(Boolean) as Cand[];
  }, [data.constellations, data.art]);

  const focusStar = (focusId?.startsWith('star:') && layers.stars) ? data.stars.find((s) => s.id === focusId) : null;

  // Compute trajectory for the selected body/satellite.
  const trajectoryPts = useMemo<TrajectoryPoint[]>(() => {
    if (!selectionId || !observer) return [];
    if (selectionId.startsWith('sat:')) {
      const norad = Number(selectionId.slice(4));
      const tle = data.tleById.get(norad);
      return tle ? satTrajectory(tle, observer, new Date(dateMs)) : [];
    }
    if (selectionId.startsWith('planet:') || selectionId === 'sun' || selectionId === 'moon') {
      return bodyTrajectory(selectionId, observer, new Date(dateMs));
    }
    return [];
  }, [selectionId, observer, dateMs, data.tleById]);

  return (
    <group>
      {observer && layers.stars && <DeepSkyObjects dsos={DSOS} observer={observer} dateMs={dateMs} />}

      <ambientLight intensity={0.22} />
      <SunLight bodies={data.bodies} />

      <FocusScan objCands={objCands} conCands={conCands} layers={layers} setFocusId={setFocusId} onFocus={onFocus} />
      <CameraTracker selectionId={selectionId} onSelect={onSelect} data={data} dateMs={dateMs} />

      <InstancedStars stars={data.stars} visible={layers.stars} selectionId={starSelection} onSelect={onSelect} />

      {layers.constellations && (
        <>
          <Constellations constellations={data.constellations} />
          <ConstellationArt art={data.art} />
        </>
      )}

      {focusStar && (
        <Billboard position={altAzToVec3(focusStar.altDeg, focusStar.azDeg, DOME_R)}>
          <Line points={focusRing} color="#ffffff" lineWidth={1} transparent opacity={0.6} />
        </Billboard>
      )}

      {layers.planets &&
        data.bodies.map((b) => (
          <group key={b.id} position={altAzToVec3(b.altDeg, b.azDeg, DOME_R)}>
            <PlanetModel
              body={b}
              focused={focusId === b.id}
              selected={selectionId === b.id}
              onClick={(e) => { e.stopPropagation(); onSelect(selectionId === b.id ? null : b.id); }}
            />
          </group>
        ))}

      {layers.satellites && data.issOrbit.length >= 2 && <IssOrbitTrack points={data.issOrbit} />}

      {layers.satellites &&
        sats.map((s) => {
          const isISS = isIssSat(s);
          const glbUrl = isISS ? '/models/iss.glb' : '/models/hubble.glb';
          const id = satId(s.noradId);
          const selected = selectionId === id;
          return (
            <group key={id} position={altAzToVec3(s.elevationDeg, s.azDeg, DOME_R)}>
              <SatModel
                iss={isISS}
                glbUrl={glbUrl}
                selected={selected}
                onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : id); }}
              />
            </group>
          );
        })}
    </group>
  );
}

function FocusScan({
  objCands,
  conCands,
  layers,
  setFocusId,
  onFocus,
}: {
  objCands: Cand[];
  conCands: Cand[];
  layers: Layers;
  setFocusId: (id: string | null) => void;
  onFocus: (info: FocusInfo | null) => void;
}) {
  const camera = useThree((s) => s.camera);
  const fwd = useRef(new THREE.Vector3());
  const cur = useRef<string | null>(null);

  useFrame(() => {
    camera.getWorldDirection(fwd.current);
    let obj: Cand | null = null;
    let od = OBJ_NEAR;
    for (const c of objCands) {
      const d = c.vec.dot(fwd.current);
      if (d > od) { od = d; obj = c; }
    }
    let info: FocusInfo | null = obj ? obj.info : null;
    if (!obj && layers.constellations) {
      let con: Cand | null = null;
      let cd = CON_NEAR;
      for (const c of conCands) {
        const d = c.vec.dot(fwd.current);
        if (d > cd) { cd = d; con = c; }
      }
      info = con ? con.info : null;
    }
    const id = info?.id ?? null;
    if (id !== cur.current) {
      cur.current = id;
      setFocusId(obj ? obj.id : null);
      onFocus(info);
    }
  });

  return null;
}

const focusRing = circlePoints(0.34, 40);

function SunLight({ bodies }: { bodies: CelestialObject[] }) {
  const sun = bodies.find((b) => b.kind === 'sun');
  const pos = sun ? altAzToVec3(sun.altDeg, sun.azDeg, 20) : [10, 10, 10];
  return <directionalLight position={pos as [number, number, number]} intensity={2.6} />;
}

const cleanSat = (n: string) => n.replace(/\s*\(.*\)$/, '');

function bodyLines(b: CelestialObject): string {
  const parts = [`Alt ${Math.round(b.altDeg)}° · Az ${Math.round(b.azDeg)}°`];
  if (b.kind === 'moon' && b.phase != null) parts.push(`${Math.round(b.phase * 100)}% lit`);
  else if (b.distanceAu != null) parts.push(`${b.distanceAu.toFixed(2)} AU away`);
  else if (b.magnitude != null) parts.push(`mag ${b.magnitude.toFixed(1)}`);
  return parts.join(' · ');
}

function starLines(s: CelestialObject): string {
  const parts: string[] = [];
  if (s.magnitude != null) parts.push(`mag ${s.magnitude.toFixed(1)}`);
  if (s.spect) {
    const label = spectLabel(s.spect);
    if (label) parts.push(label);
  }
  if (s.distLy != null) parts.push(`${s.distLy.toLocaleString()} ly away`);
  if (s.con) parts.push(`in ${s.con}`);
  return parts.join(' · ');
}

// Translate a spectral type string (e.g. "K1III", "B5V") into a short,
// human-readable description of the star's colour and class.
function spectLabel(spect: string): string | null {
  const c = spect.trim()[0];
  const CLASS: Record<string, string> = {
    O: 'Hot blue star', B: 'Blue-white star', A: 'White star', F: 'Yellow-white star',
    G: 'Sun-like star', K: 'Orange star', M: 'Red star',
  };
  return CLASS[c] ?? null;
}

function satLines(s: SatelliteState): string {
  const parts: string[] = [];
  if (s.velocityKmS != null) parts.push(`${s.velocityKmS.toFixed(2)} km/s`);
  parts.push(`${Math.round(s.altKm)} km up`);
  parts.push(`Alt ${Math.round(s.elevationDeg)}°`);
  return parts.join(' · ');
}

function IssOrbitTrack({ points }: { points: IssOrbitPoint[] }) {
  const segments = useMemo(() => {
    const segs: Array<[number, number, number][]> = [];
    let current: Array<[number, number, number]> = [];
    for (const p of points) {
      if (p.altDeg > 0) current.push(altAzToVec3(p.altDeg, p.azDeg, DOME_R));
      else if (current.length >= 2) { segs.push(current); current = []; }
      else current = [];
    }
    if (current.length >= 2) segs.push(current);
    return segs;
  }, [points]);

  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((seg, i) => (
        <Line key={i} points={seg} color="#6b7280" lineWidth={1} transparent opacity={0.35} dashed dashSize={0.15} gapSize={0.1} />
      ))}
    </>
  );
}

function CameraTracker({
  selectionId,
  onSelect,
  data,
  dateMs,
}: {
  selectionId: string | null;
  onSelect: (id: string | null) => void;
  data: SkyData;
  dateMs: number;
}) {
  const { camera, controls, gl } = useThree();
  const observer = useZenith((s) => s.observer);
  const targetVec = useRef<THREE.Vector3 | null>(null);

  // When selectionId changes, calculate its direction vector
  useEffect(() => {
    if (!selectionId || !observer) {
      targetVec.current = null;
      return;
    }

    let altDeg = 0;
    let azDeg = 0;
    let found = false;

    if (selectionId.startsWith('star:')) {
      const s = data.stars.find((star) => star.id === selectionId);
      if (s) {
        altDeg = s.altDeg;
        azDeg = s.azDeg;
        found = true;
      }
    } else if (selectionId.startsWith('planet:') || selectionId === 'sun' || selectionId === 'moon') {
      const b = data.bodies.find((body) => body.id === selectionId);
      if (b) {
        altDeg = b.altDeg;
        azDeg = b.azDeg;
        found = true;
      }
    } else if (selectionId.startsWith('sat:')) {
      const norad = Number(selectionId.slice(4));
      const s = data.satellites.find((sat) => sat.noradId === norad);
      if (s) {
        altDeg = s.elevationDeg;
        azDeg = s.azDeg;
        found = true;
      }
    } else if (selectionId.startsWith('dso:')) {
      const dsoId = selectionId.slice(4);
      const dso = DSOS.find((d) => d.id === dsoId);
      if (dso) {
        const date = new Date(dateMs);
        const projected = raDecToAltAz(dso.raDeg, dso.decDeg, observer, date);
        altDeg = projected.altDeg;
        azDeg = projected.azDeg;
        found = true;
      }
    } else if (selectionId.startsWith('con:')) {
      const conId = selectionId.slice(4);
      const con = data.constellations.find((c) => c.id === conId);
      if (con) {
        const dir = new THREE.Vector3();
        let n = 0;
        for (const path of con.paths) {
          for (const [alt, az] of path) {
            const [ux, uy, uz] = altAzToVec3(alt, az, 1);
            dir.add(new THREE.Vector3(ux, uy, uz));
            n++;
          }
        }
        if (n > 0) {
          dir.normalize();
          targetVec.current = dir;
          return;
        }
      }
    }

    if (found) {
      const [x, y, z] = altAzToVec3(altDeg, azDeg, 1);
      targetVec.current = new THREE.Vector3(x, y, z).normalize();
    } else {
      targetVec.current = null;
    }
  }, [selectionId, data, observer, dateMs]);

  // Listen to dragging gestures when selectionId is active, releasing camera tracking if dragged.
  useEffect(() => {
    if (!selectionId) return;

    let startX = 0;
    let startY = 0;
    let isDown = false;
    let triggered = false;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      isDown = true;
      triggered = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown || triggered) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 22px is a perfect drag threshold - not too sensitive, not too stubborn
      if (dist > 22) {
        triggered = true;
        onSelect(null);
      }
    };

    const onPointerUp = () => {
      isDown = false;
    };

    const dom = gl.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [selectionId, gl, onSelect]);

  // Smoothly lerp camera position to point at targetVec
  useFrame(() => {
    if (!targetVec.current) return;
    const r = camera.position.length();
    // target camera position is -V * r
    const targetCamPos = targetVec.current.clone().multiplyScalar(-r);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(0, 0, 0);
    if (controls) {
      // @ts-ignore
      controls.update();
    }
  });

  return null;
}

