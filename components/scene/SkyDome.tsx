'use client';

import { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { projectAltAz, circlePoints } from '@/lib/dome';
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
    const [x, y] = projectAltAz(s.altDeg, s.azDeg, DOME_R);
    pts.push(x, y, 0);
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

  const rings = useMemo(
    () => [circlePoints(DOME_R), circlePoints((DOME_R * 2) / 3), circlePoints(DOME_R / 3)],
    [],
  );

  return (
    <group>
      {/* horizon + altitude rings */}
      <Line points={rings[0]} color="#333333" lineWidth={1.5} />
      <Line points={rings[1]} color="#222222" lineWidth={1} />
      <Line points={rings[2]} color="#222222" lineWidth={1} />

      {/* cardinal marks */}
      <Cardinal label="N" pos={[0, DOME_R, 0]} />
      <Cardinal label="E" pos={[-DOME_R, 0, 0]} />
      <Cardinal label="S" pos={[0, -DOME_R, 0]} />
      <Cardinal label="W" pos={[DOME_R, 0, 0]} />

      {/* zenith marker (dead centre) */}
      <Line points={circlePoints(0.12, 32)} color="#d71921" lineWidth={1.5} />
      <Text position={[0, -0.32, 0]} fontSize={0.16} color="#d71921" anchorX="center">
        ZENITH
      </Text>

      {/* stars */}
      {layers.stars && (
        <>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dimStars, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#cdd6f4" size={0.05} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
          </points>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[brightStars, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#ffffff" size={0.11} sizeAttenuation transparent depthWrite={false} />
          </points>
        </>
      )}

      {/* constellation lines */}
      {layers.constellations &&
        data.constellations.flatMap((c) =>
          c.paths.map((path, i) => {
            const pts: [number, number, number][] = [];
            for (const [alt, az] of path) {
              if (alt <= 0) {
                if (pts.length >= 2) return null; // stop at horizon
                pts.length = 0;
                continue;
              }
              const [x, y] = projectAltAz(alt, az, DOME_R);
              pts.push([x, y, 0]);
            }
            if (pts.length < 2) return null;
            return (
              <Line
                key={`${c.id}-${i}`}
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
            const [x, y] = projectAltAz(b.altDeg, b.azDeg, DOME_R);
            const selected = selectionId === b.id;
            return (
              <group key={b.id} position={[x, y, 0.01]}>
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
                  <Text position={[0, 0.26, 0]} fontSize={0.15} color="#999999" anchorX="center">
                    {b.name}
                  </Text>
                )}
              </group>
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
            const [x, y] = projectAltAz(s.elevationDeg, s.azDeg, DOME_R);
            const isISS = s.name.includes('ISS');
            const id = satId(s.noradId);
            const selected = selectionId === id;
            return (
              <group key={id} position={[x, y, 0.02]}>
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
                  <Text position={[0, 0.24, 0]} fontSize={0.15} color="#4a9e5c" anchorX="center">
                    ISS
                  </Text>
                )}
              </group>
            );
          })}
    </group>
  );
}

function Cardinal({ label, pos }: { label: string; pos: [number, number, number] }) {
  return (
    <Text position={pos} fontSize={0.22} color="#999999" anchorX="center" anchorY="middle">
      {label}
    </Text>
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
        const [x, y] = projectAltAz(p.altDeg, p.azDeg, DOME_R);
        current.push([x, y, 0.005]);
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
