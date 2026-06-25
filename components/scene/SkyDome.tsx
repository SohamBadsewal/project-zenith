'use client';

import { useMemo } from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import { altAzToVec3, horizonRing, altitudeRing } from '@/lib/dome';
import { circlePointTexture } from '@/lib/pointTexture';
import { satId, type SkyData, type IssOrbitPoint } from '@/hooks/useSky';
import type { CelestialObject } from '@/types';

const DOME_R = 5;

export interface Layers {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  satellites: boolean;
  labels: boolean;
}

const BODY_COLOR: Record<string, string> = {
  sun: '#ffd27f',
  moon: '#e8e8e8',
  planet: '#d4a843',
  star: '#ffffff',
};

function starPositions(stars: CelestialObject[], minMag: number, maxMag: number) {
  const pts: number[] = [];
  for (const s of stars) {
    if (!s.aboveHorizon) continue;
    const mag = s.magnitude ?? 6;
    if (mag < minMag || mag >= maxMag) continue;
    const [x, y, z] = altAzToVec3(s.altDeg, s.azDeg, DOME_R);
    pts.push(x, y, z);
  }
  return new Float32Array(pts);
}

export function SkyDome({
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
  const brightStars = useMemo(() => starPositions(data.stars, -2, 2.5), [data.stars]);
  const dimStars = useMemo(() => starPositions(data.stars, 2.5, 7), [data.stars]);
  const starTex = useMemo(() => circlePointTexture(), []);

  const rings = useMemo(
    () => ({
      horizon: horizonRing(DOME_R),
      alt30: altitudeRing(30, DOME_R),
      alt60: altitudeRing(60, DOME_R),
    }),
    [],
  );

  return (
    <group>
      {/* horizon great circle + altitude rings */}
      <Line points={rings.horizon} color="#3a3a3a" lineWidth={1.5} />
      <Line points={rings.alt30} color="#1f1f1f" lineWidth={1} />
      <Line points={rings.alt60} color="#1f1f1f" lineWidth={1} />

      {/* cardinal marks, just above the horizon */}
      <Cardinal label="N" alt={3} az={0} />
      <Cardinal label="E" alt={3} az={90} />
      <Cardinal label="S" alt={3} az={180} />
      <Cardinal label="W" alt={3} az={270} />

      {/* zenith marker (straight up) */}
      <Billboard position={altAzToVec3(90, 0, DOME_R)}>
        <Line points={zenithCircle} color="#d71921" lineWidth={1.5} />
        <Text position={[0, -0.4, 0]} fontSize={0.18} color="#d71921" anchorX="center">
          ZENITH
        </Text>
      </Billboard>

      {/* stars */}
      {layers.stars && (
        <>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dimStars, 3]} />
            </bufferGeometry>
            <pointsMaterial map={starTex} color="#cdd6f4" size={0.07} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
          </points>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[brightStars, 3]} />
            </bufferGeometry>
            <pointsMaterial map={starTex} color="#ffffff" size={0.15} sizeAttenuation transparent depthWrite={false} />
          </points>
        </>
      )}

      {/* constellation lines */}
      {layers.constellations &&
        data.constellations.flatMap((c, ci) =>
          c.paths.map((path, i) => {
            const pts: [number, number, number][] = [];
            for (const [alt, az] of path) {
              if (alt <= 0) {
                if (pts.length >= 2) return null; // stop at horizon
                pts.length = 0;
                continue;
              }
              pts.push(altAzToVec3(alt, az, DOME_R));
            }
            if (pts.length < 2) return null;
            return (
              <Line
                key={`${c.id}-${ci}-${i}`}
                points={pts}
                color="#5b9bf6"
                lineWidth={0.8}
                transparent
                opacity={0.5}
              />
            );
          }),
        )}

      {/* sun / moon / planets */}
      {layers.planets &&
        data.bodies
          .filter((b) => b.aboveHorizon)
          .map((b) => {
            const selected = selectionId === b.id;
            return (
              <Billboard key={b.id} position={altAzToVec3(b.altDeg, b.azDeg, DOME_R)}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(selected ? null : b.id);
                  }}
                >
                  <circleGeometry args={[b.kind === 'sun' || b.kind === 'moon' ? 0.16 : 0.1, 24]} />
                  <meshBasicMaterial color={selected ? '#d71921' : BODY_COLOR[b.kind]} />
                </mesh>
                {layers.labels && (
                  <Text position={[0, 0.28, 0]} fontSize={0.16} color="#999999" anchorX="center">
                    {b.name}
                  </Text>
                )}
              </Billboard>
            );
          })}

      {/* ISS orbit track */}
      {layers.satellites && data.issOrbit.length >= 2 && (
        <IssOrbitTrack points={data.issOrbit} />
      )}

      {/* satellites (ISS prominent) */}
      {layers.satellites &&
        data.satellites
          .filter((s) => s.aboveHorizon)
          .map((s) => {
            const isISS = s.name.includes('ISS');
            const id = satId(s.noradId);
            const selected = selectionId === id;
            return (
              <Billboard key={id} position={altAzToVec3(s.elevationDeg, s.azDeg, DOME_R)}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(selected ? null : id);
                  }}
                >
                  <circleGeometry args={[isISS ? 0.12 : 0.05, 16]} />
                  <meshBasicMaterial color={selected ? '#d71921' : '#4a9e5c'} />
                </mesh>
                {layers.labels && isISS && (
                  <Text position={[0, 0.26, 0]} fontSize={0.16} color="#4a9e5c" anchorX="center">
                    ISS
                  </Text>
                )}
              </Billboard>
            );
          })}
    </group>
  );
}

/** Small red circle (in local billboard space) reused for the zenith marker. */
const zenithCircle: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    pts.push([Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0]);
  }
  return pts;
})();

function Cardinal({ label, alt, az }: { label: string; alt: number; az: number }) {
  return (
    <Billboard position={altAzToVec3(alt, az, DOME_R)}>
      <Text fontSize={0.26} color="#999999" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </Billboard>
  );
}

/** ISS orbit track — segments grouped above/below horizon, fading toward future. */
function IssOrbitTrack({ points }: { points: IssOrbitPoint[] }) {
  const segments = useMemo(() => {
    // Split into contiguous above-horizon segments.
    const segs: Array<[number, number, number][]> = [];
    let current: Array<[number, number, number]> = [];
    for (const p of points) {
      if (p.altDeg > 0) {
        current.push(altAzToVec3(p.altDeg, p.azDeg, DOME_R));
      } else if (current.length >= 2) {
        segs.push(current);
        current = [];
      } else {
        current = [];
      }
    }
    if (current.length >= 2) segs.push(current);
    return segs;
  }, [points]);

  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((seg, i) => (
        <Line
          key={i}
          points={seg}
          color="#4a9e5c"
          lineWidth={1}
          transparent
          opacity={0.35}
          dashed
          dashSize={0.15}
          gapSize={0.1}
        />
      ))}
    </>
  );
}
