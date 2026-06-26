'use client';

import { useMemo, useState } from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import { altAzToVec3 } from '@/lib/dome';
import { satId, type SkyData, type IssOrbitPoint } from '@/hooks/useSky';
import type { CelestialObject, SatelliteState } from '@/types';
import { InstancedStars } from './InstancedStars';
import { SatModel } from './SatModel';
import { PlanetModel } from './PlanetModel';
import { Constellations } from './Constellations';
import { FocusController, FocusCard, type Candidate } from './ProximityReticle';

const DOME_R = 5;

export interface Layers {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  satellites: boolean;
  labels: boolean;
}

const isNamed = (s: CelestialObject) => !/^HR\s/.test(s.name);

export function SkyPlanetarium({
  data,
  layers,
  selectionId,
  onSelect,
}: {
  data: SkyData;
  layers: Layers;
  selectionId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const starSelection = selectionId?.startsWith('star:') ? selectionId : null;

  const namedStars = useMemo(() => data.stars.filter(isNamed), [data.stars]);

  const candidates = useMemo<Candidate[]>(() => {
    const out: Candidate[] = [];
    if (layers.planets) for (const b of data.bodies) out.push({ id: b.id, altDeg: b.altDeg, azDeg: b.azDeg });
    if (layers.stars) for (const s of namedStars) out.push({ id: s.id, altDeg: s.altDeg, azDeg: s.azDeg });
    if (layers.satellites)
      for (const s of data.satellites) out.push({ id: satId(s.noradId), altDeg: s.elevationDeg, azDeg: s.azDeg });
    return out;
  }, [data.bodies, data.satellites, namedStars, layers]);

  const focus = useMemo(() => {
    if (!focusId) return null;
    const b = data.bodies.find((x) => x.id === focusId);
    if (b) return { altDeg: b.altDeg, azDeg: b.azDeg, title: b.name, lines: bodyLines(b), star: false };
    const s = namedStars.find((x) => x.id === focusId);
    if (s) return { altDeg: s.altDeg, azDeg: s.azDeg, title: s.name, lines: starLines(s), star: true };
    const sat = data.satellites.find((x) => satId(x.noradId) === focusId);
    if (sat) return { altDeg: sat.elevationDeg, azDeg: sat.azDeg, title: sat.name, lines: satLines(sat), star: false };
    return null;
  }, [focusId, data.bodies, data.satellites, namedStars]);

  return (
    <group>
      <ambientLight intensity={0.22} />
      <SunLight bodies={data.bodies} />

      <FocusController candidates={candidates} current={focusId} onFocus={setFocusId} />

      <InstancedStars stars={data.stars} visible={layers.stars} selectionId={starSelection} onSelect={onSelect} />

      {layers.constellations && <Constellations constellations={data.constellations} />}

      {layers.planets &&
        data.bodies.map((b) => (
          <group key={b.id} position={altAzToVec3(b.altDeg, b.azDeg, DOME_R)}>
            <PlanetModel
              body={b}
              focused={focusId === b.id}
              selected={selectionId === b.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selectionId === b.id ? null : b.id);
              }}
            />
            {layers.labels && focusId !== b.id && (
              <Billboard>
                <Text position={[0, 0.34, 0]} fontSize={0.16} color="#999999" anchorX="center">
                  {b.name}
                </Text>
              </Billboard>
            )}
          </group>
        ))}

      {layers.satellites && data.issOrbit.length >= 2 && <IssOrbitTrack points={data.issOrbit} />}

      {layers.satellites &&
        data.satellites.map((s) => {
          const isISS = s.name.includes('ISS');
          const glbUrl = isISS ? '/models/iss.glb' : /HST|HUBBLE/i.test(s.name) ? '/models/hubble.glb' : undefined;
          const id = satId(s.noradId);
          const selected = selectionId === id;
          const focused = focusId === id;
          return (
            <group key={id} position={altAzToVec3(s.elevationDeg, s.azDeg, DOME_R)}>
              {selected ? (
                <SatModel iss={isISS} glbUrl={glbUrl} onClick={(e) => { e.stopPropagation(); onSelect(null); }} />
              ) : (
                <Billboard>
                  <mesh
                    scale={focused ? 1.8 : 1}
                    onClick={(e) => { e.stopPropagation(); onSelect(id); }}
                  >
                    <circleGeometry args={[isISS ? 0.12 : 0.05, 16]} />
                    <meshBasicMaterial color={focused ? '#aef0c0' : '#4a9e5c'} />
                  </mesh>
                </Billboard>
              )}
            </group>
          );
        })}

      {focus && (
        <FocusCard altDeg={focus.altDeg} azDeg={focus.azDeg} title={focus.title} lines={focus.lines} star={focus.star} />
      )}
    </group>
  );
}

function SunLight({ bodies }: { bodies: CelestialObject[] }) {
  const sun = bodies.find((b) => b.kind === 'sun');
  const pos = sun ? altAzToVec3(sun.altDeg, sun.azDeg, 20) : [10, 10, 10];
  return <directionalLight position={pos as [number, number, number]} intensity={2.6} />;
}

const KIND_LABEL: Record<string, string> = { sun: 'STAR · OUR SUN', moon: 'MOON', planet: 'PLANET', star: 'STAR' };

function bodyLines(b: CelestialObject): string[] {
  const lines = [`${KIND_LABEL[b.kind] ?? 'BODY'} · ALT ${Math.round(b.altDeg)}° · AZ ${Math.round(b.azDeg)}°`];
  if (b.kind === 'moon' && b.phase != null) lines.push(`ILLUMINATED ${Math.round(b.phase * 100)}%`);
  else if (b.distanceAu != null) lines.push(`${b.distanceAu.toFixed(2)} AU from Earth`);
  else if (b.magnitude != null) lines.push(`MAG ${b.magnitude.toFixed(1)}`);
  return lines;
}

function starLines(s: CelestialObject): string[] {
  const lines = [`STAR · ALT ${Math.round(s.altDeg)}° · AZ ${Math.round(s.azDeg)}°`];
  if (s.magnitude != null) lines.push(`MAG ${s.magnitude.toFixed(1)}`);
  return lines;
}

function satLines(s: SatelliteState): string[] {
  const lines = [`SATELLITE · ALT ${Math.round(s.elevationDeg)}° · AZ ${Math.round(s.azDeg)}°`];
  const parts: string[] = [];
  if (s.velocityKmS != null) parts.push(`${s.velocityKmS.toFixed(2)} km/s`);
  parts.push(`${Math.round(s.altKm)} km up`);
  lines.push(parts.join(' · '));
  return lines;
}

function IssOrbitTrack({ points }: { points: IssOrbitPoint[] }) {
  const segments = useMemo(() => {
    const segs: Array<[number, number, number][]> = [];
    let current: Array<[number, number, number]> = [];
    for (const p of points) {
      if (p.altDeg > 0) current.push(altAzToVec3(p.altDeg, p.azDeg, DOME_R));
      else if (current.length >= 2) {
        segs.push(current);
        current = [];
      } else current = [];
    }
    if (current.length >= 2) segs.push(current);
    return segs;
  }, [points]);

  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((seg, i) => (
        <Line key={i} points={seg} color="#4a9e5c" lineWidth={1} transparent opacity={0.35} dashed dashSize={0.15} gapSize={0.1} />
      ))}
    </>
  );
}
