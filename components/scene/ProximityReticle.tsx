'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { altAzToVec3, circlePoints } from '@/lib/dome';

const DOME_R = 5;
const NEAR = Math.cos((6 * Math.PI) / 180);

export type Candidate = { id: string; altDeg: number; azDeg: number };

export function FocusController({
  candidates,
  current,
  onFocus,
}: {
  candidates: Candidate[];
  current: string | null;
  onFocus: (id: string | null) => void;
}) {
  const camera = useThree((s) => s.camera);
  const fwd = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  useFrame(() => {
    camera.getWorldDirection(fwd.current);
    let best: string | null = null;
    let bestDot = NEAR;
    for (const c of candidates) {
      const [x, y, z] = altAzToVec3(c.altDeg, c.azDeg, 1);
      const d = dir.current.set(x, y, z).dot(fwd.current);
      if (d > bestDot) {
        bestDot = d;
        best = c.id;
      }
    }
    if (best !== current) onFocus(best);
  });

  return null;
}

const ring = circlePoints(0.34, 40);

export function FocusCard({
  altDeg,
  azDeg,
  title,
  lines,
  star,
}: {
  altDeg: number;
  azDeg: number;
  title: string;
  lines: string[];
  star?: boolean;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const pos = altAzToVec3(altDeg, azDeg, DOME_R);

  return (
    <Billboard position={pos}>
      {star && <Line points={ring} color="#ffffff" lineWidth={1} transparent opacity={0.7} />}
      <Html position={[0, -0.45, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity .35s ease, transform .35s ease',
            whiteSpace: 'nowrap',
            border: '1px solid var(--border-visible, #333)',
            background: 'var(--surface, rgba(10,10,10,0.94))',
            padding: '8px 12px',
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            lineHeight: 1.45,
          }}
        >
          <div style={{ color: 'var(--text-primary, #fff)', fontSize: 14, fontWeight: 600 }}>{title}</div>
          {lines.map((l, i) => (
            <div key={i} style={{ color: 'var(--text-secondary, #999)', fontSize: 11 }}>
              {l}
            </div>
          ))}
        </div>
      </Html>
    </Billboard>
  );
}
