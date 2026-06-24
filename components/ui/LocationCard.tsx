'use client';

import { useEffect, useState } from 'react';
import { useZenith } from '@/store/useZenith';
import { formatLatLon } from '@/lib/geo';
import type { GeocodeResponse } from '@/types';

function useLocalTime(timezone?: string): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
  } catch {
    return '—';
  }
}

/** The gate before confirm: place / coords / tz / live local time, then CONFIRM. */
export function LocationCard() {
  const pending = useZenith((s) => s.pending);
  const confirm = useZenith((s) => s.confirmLocation);
  const clearPending = useZenith((s) => s.clearPending);
  const [geo, setGeo] = useState<GeocodeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pending) {
      setGeo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setGeo(null);
    fetch(`/api/geocode?lat=${pending.latDeg}&lon=${pending.lonDeg}`)
      .then((r) => r.json())
      .then((g: GeocodeResponse) => {
        if (!cancelled) setGeo(g);
      })
      .catch(() => {
        if (!cancelled) setGeo({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pending]);

  const localTime = useLocalTime(geo?.timezone);
  if (!pending) return null;

  const place = geo?.placeName ?? (loading ? 'LOCATING…' : 'Open water / remote');

  return (
    <div className="absolute right-4 top-4 z-20 w-[280px] max-w-[calc(100vw-2rem)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:right-6 sm:top-6">
      <div className="label">Selected location</div>
      <div className="mt-1 font-sans text-lg font-medium text-white">{place}</div>

      <dl className="mt-4 space-y-2 font-mono text-[12px]">
        <Row label="Coord" value={formatLatLon(pending.latDeg, pending.lonDeg)} accent />
        <Row label="Timezone" value={geo?.timezone ?? '—'} />
        <Row label="Local time" value={localTime} />
        <Row
          label="Elevation"
          value={geo?.elevationM != null ? `${Math.round(geo.elevationM)} m` : '—'}
        />
      </dl>

      <button
        onClick={confirm}
        className="mt-5 h-11 w-full bg-white font-mono text-[13px] uppercase tracking-[0.06em] text-black transition-colors hover:bg-zinc-200"
      >
        Confirm location ▸
      </button>
      <button
        onClick={clearPending}
        className="mt-2 h-9 w-full border border-[var(--border-visible)] font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)] transition-colors hover:text-white"
      >
        Re-pick
      </button>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="label">{label}</dt>
      <dd className={accent ? 'text-[var(--interactive)]' : 'text-[var(--text-primary)]'}>
        {value}
      </dd>
    </div>
  );
}
