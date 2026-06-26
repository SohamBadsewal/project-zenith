'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { altAzToVec3 } from '@/lib/dome';
import type { TrajectoryPoint } from '@/lib/trajectory';

const DOME_R = 5;
const COLOR = '#5fdde6'; // glowing cyan, per reference video
const DRAW_DURATION = 0.6; // seconds for the line to draw in

/**
 * Animated, glowing cyan trajectory line that draws itself in over ~0.6s.
 * Splits at the horizon so only above-horizon arcs render. Continuous (NOT
 * dashed), matching the reference video. Only the selected object's trajectory
 * is mounted — unmounted objects have no Trajectory rendered at all.
 */
export function Trajectory({ points }: { points: TrajectoryPoint[] }) {
  // Split into above-horizon segments.
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

  // Track the draw-in animation start time per segment set.
  const startTime = useRef(performance.now());

  // Reset animation when segments change.
  useEffect(() => {
    startTime.current = performance.now();
  }, [segments]);

  // Progress tracker for drawRange.
  const progress = useRef(0);

  useFrame(() => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    const t = Math.min(1, elapsed / DRAW_DURATION);
    // Ease-out cubic for a satisfying "snapping into place" feel.
    progress.current = 1 - Math.pow(1 - t, 3);
  });

  if (segments.length === 0) return null;

  return (
    <group>
      {segments.map((seg, i) => (
        <TrajectorySegment key={i} points={seg} progress={progress} />
      ))}
    </group>
  );
}

/**
 * One continuous above-horizon arc with animated drawRange. Uses the
 * `drawRange` property on the underlying BufferGeometry so we don't
 * need to re-slice the points array every frame.
 */
function TrajectorySegment({
  points,
  progress,
}: {
  points: Array<[number, number, number]>;
  progress: React.RefObject<number>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);

  // Set initial drawRange to 0; the useFrame callback animates it.
  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.geometry.setDrawRange(0, 0);
    }
  }, []);

  useFrame(() => {
    const geo = lineRef.current?.geometry;
    if (!geo) return;
    const total = geo.attributes.instanceStart?.count ?? points.length;
    const count = Math.max(2, Math.round(progress.current * total));
    geo.setDrawRange(0, count);
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={COLOR}
      lineWidth={1.6}
      transparent
      opacity={0.85}
    />
  );
}
