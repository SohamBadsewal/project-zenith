'use client';

import { useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, Line, Text } from '@react-three/drei';
import { altAzToVec3, horizonRing, altitudeRing } from '@/lib/dome';
import { satId, type SkyData, type IssOrbitPoint } from '@/hooks/useSky';
import type { CelestialObject, SatelliteState } from '@/types';
import { InstancedStars } from './InstancedStars';
import { SatModel } from './SatModel';

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
  const [hoverId, setHoverId] = useState<string | null>(null);
  // Stars are now picked via InstancedStars; only star:* ids reach its selection.
  const starSelection = selectionId?.startsWith('star:') ? selectionId : null;

  const rings = useMemo(
    () => ({
      horizon: horizonRing(DOME_R),
      alt30: altitudeRing(30, DOME_R),
      alt60: altitudeRing(60, DOME_R),
    }),
    [],
  );

  const enter = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverId(id);
    document.body.style.cursor = 'pointer';
  };
  const leave = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverId((cur) => (cur === id ? null : cur));
    document.body.style.cursor = '';
  };

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

      {/* stars — single InstancedMesh with per-instance spectral color + BVH picking */}
      <InstancedStars
        stars={data.stars}
        visible={layers.stars}
        selectionId={starSelection}
        onSelect={onSelect}
      />

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
            const hovered = hoverId === b.id;
            return (
              <Billboard key={b.id} position={altAzToVec3(b.altDeg, b.azDeg, DOME_R)}>
                <mesh
                  scale={hovered ? 1.4 : 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(selected ? null : b.id);
                  }}
                  onPointerOver={enter(b.id)}
                  onPointerOut={leave(b.id)}
                >
                  <circleGeometry args={[b.kind === 'sun' || b.kind === 'moon' ? 0.16 : 0.1, 24]} />
                  <meshBasicMaterial color={selected ? '#d71921' : hovered ? '#ffffff' : BODY_COLOR[b.kind]} />
                </mesh>
                {layers.labels && !hovered && (
                  <Text position={[0, 0.28, 0]} fontSize={0.16} color="#999999" anchorX="center">
                    {b.name}
                  </Text>
                )}
                {hovered && <Tooltip title={b.name} lines={bodyLines(b)} />}
              </Billboard>
            );
          })}

      {/* ISS orbit track */}
      {layers.satellites && data.issOrbit.length >= 2 && <IssOrbitTrack points={data.issOrbit} />}

      {/* satellites — billboard marker, swaps to a 3D SatModel when selected */}
      {layers.satellites &&
        data.satellites
          .filter((s) => s.aboveHorizon)
          .map((s) => {
            const isISS = s.name.includes('ISS');
            const glbUrl = isISS
              ? '/models/iss.glb'
              : /HST|HUBBLE/i.test(s.name)
                ? '/models/hubble.glb'
                : undefined;
            const id = satId(s.noradId);
            const selected = selectionId === id;
            const hovered = hoverId === id;
            return (
              <group key={id} position={altAzToVec3(s.elevationDeg, s.azDeg, DOME_R)}>
                {selected ? (
                  <SatModel
                    iss={isISS}
                    glbUrl={glbUrl}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(null);
                    }}
                  />
                ) : (
                  <Billboard>
                    <mesh
                      scale={hovered ? 1.5 : 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(id);
                      }}
                      onPointerOver={enter(id)}
                      onPointerOut={leave(id)}
                    >
                      <circleGeometry args={[isISS ? 0.12 : 0.05, 16]} />
                      <meshBasicMaterial color={hovered ? '#aef0c0' : '#4a9e5c'} />
                    </mesh>
                  </Billboard>
                )}
                {layers.labels && isISS && !hovered && (
                  <Billboard>
                    <Text position={[0, selected ? 0.6 : 0.26, 0]} fontSize={0.16} color="#4a9e5c" anchorX="center">
                      ISS
                    </Text>
                  </Billboard>
                )}
                {hovered && (
                  <Billboard>
                    <Tooltip title={s.name} lines={satLines(s)} />
                  </Billboard>
                )}
              </group>
            );
          })}
    </group>
  );
}

// ── Helpers (ported from SkyDome.tsx — identical) ─────────────────────

/** Small red circle (in local billboard space) reused for the zenith marker. */
const zenithCircle: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    pts.push([Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0]);
  }
  return pts;
})();

const KIND_LABEL: Record<string, string> = {
  sun: 'STAR · OUR SUN',
  moon: 'MOON',
  planet: 'PLANET',
  star: 'STAR',
};

function bodyLines(b: CelestialObject): string[] {
  const lines = [`${KIND_LABEL[b.kind] ?? 'BODY'} · ALT ${Math.round(b.altDeg)}° · AZ ${Math.round(b.azDeg)}°`];
  if (b.kind === 'moon' && b.phase != null) lines.push(`ILLUMINATED ${Math.round(b.phase * 100)}%`);
  else if (b.distanceAu != null) lines.push(`${b.distanceAu.toFixed(2)} AU from Earth`);
  else if (b.magnitude != null) lines.push(`MAG ${b.magnitude.toFixed(1)}`);
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

/** Screen-anchored HTML label that pops up on hover, in the Nothing palette. */
function Tooltip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Html position={[0, 0.32, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div
        style={{
          transform: 'translateY(-100%)',
          whiteSpace: 'nowrap',
          border: '1px solid var(--border-visible, #333)',
          background: 'var(--surface, rgba(10,10,10,0.92))',
          padding: '6px 10px',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          lineHeight: 1.4,
        }}
      >
        <div style={{ color: 'var(--text-primary, #fff)', fontSize: 13, fontWeight: 500 }}>{title}</div>
        {lines.map((l, i) => (
          <div key={i} style={{ color: 'var(--text-secondary, #999)', fontSize: 11 }}>
            {l}
          </div>
        ))}
      </div>
    </Html>
  );
}

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
