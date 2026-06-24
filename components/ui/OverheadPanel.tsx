'use client';

import { useMemo } from 'react';
import { satId, type SkyData } from '@/hooks/useSky';

interface Row {
  id: string;
  name: string;
  altDeg: number;
  azDeg: number;
  kind: string;
  trend?: string;
  color: string;
  speedKmS?: number;
}

const KIND_COLOR: Record<string, string> = {
  sun: 'var(--warning)',
  moon: 'var(--text-primary)',
  planet: 'var(--warning)',
  star: 'var(--text-primary)',
  satellite: 'var(--success)',
};

const TREND_ICON: Record<string, string> = {
  rising: '▲',
  setting: '▼',
  peak: '◆',
};

/** "OVERHEAD NOW" — everything above the horizon, sorted by altitude. */
export function OverheadPanel({
  data,
  selectionId,
  onSelect,
}: {
  data: SkyData;
  selectionId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const rows = useMemo<Row[]>(() => {
    const bodies: Row[] = data.bodies
      .filter((b) => b.aboveHorizon && (b.kind !== 'star' || (b.magnitude ?? 9) < 1.5))
      .map((b) => ({
        id: b.id,
        name: b.name,
        altDeg: b.altDeg,
        azDeg: b.azDeg,
        kind: b.kind,
        color: KIND_COLOR[b.kind] ?? 'var(--text-primary)',
      }));
    const sats: Row[] = data.satellites
      .filter((s) => s.aboveHorizon)
      .map((s) => ({
        id: satId(s.noradId),
        name: s.name.replace(/\s*\(.*\)$/, ''),
        altDeg: s.elevationDeg,
        azDeg: s.azDeg,
        kind: 'satellite',
        trend: s.trend,
        color: KIND_COLOR.satellite,
        speedKmS: s.velocityKmS,
      }));
    return [...bodies, ...sats].sort((a, b) => b.altDeg - a.altDeg);
  }, [data]);

  const satCount = data.satellites.filter((s) => s.aboveHorizon).length;

  return (
    <div className="absolute right-4 top-4 z-20 flex max-h-[70vh] w-[260px] max-w-[calc(100vw-2rem)] flex-col border border-[var(--border)] bg-[var(--surface)] sm:right-6 sm:top-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="label text-[var(--text-primary)]">Overhead now</span>
        <span
          className={`label ${data.dataMode === 'live' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}
        >
          {data.dataMode === 'live' ? '● LIVE' : '[ OFFLINE DATA ]'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center font-mono text-[12px] text-[var(--text-disabled)]">
            [ QUIET SKY ]
          </div>
        ) : (
          rows.map((r) => {
            const selected = selectionId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(selected ? null : r.id)}
                className={`flex w-full flex-col gap-0.5 border-b border-[var(--border)] px-4 py-2 text-left transition-colors hover:bg-[var(--surface-raised)] ${
                  selected ? 'bg-[var(--surface-raised)]' : ''
                }`}
              >
                <div className="flex w-full items-baseline justify-between gap-2">
                  <span className="font-mono text-[12px] text-[var(--text-secondary)]">
                    {r.name}
                  </span>
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: selected ? 'var(--accent)' : r.color }}
                  >
                    ALT {Math.round(r.altDeg)}°
                    {r.trend ? ` ${TREND_ICON[r.trend] ?? ''}` : ''}
                  </span>
                </div>
                {r.speedKmS != null && (
                  <div className="font-mono text-[10px] text-[var(--text-disabled)]">
                    {r.speedKmS.toFixed(2)} km/s · AZ {Math.round(r.azDeg)}°
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3 font-mono text-[12px] text-[var(--success)]">
        {satCount} SATELLITES IN VIEW
      </div>
    </div>
  );
}
