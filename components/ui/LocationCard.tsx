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
  const mode = useZenith((s) => s.mode);
  const observer = useZenith((s) => s.observer);
  const compareObserver = useZenith((s) => s.compareObserver);
  const pending = useZenith((s) => s.pending);
  const confirm = useZenith((s) => s.confirmLocation);
  const clearPending = useZenith((s) => s.clearPending);

  const [geo, setGeo] = useState<GeocodeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const target = pending ?? observer;
    if (!target) {
      setGeo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setGeo(null);
    fetch(`/api/geocode?lat=${target.latDeg}&lon=${target.lonDeg}`)
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
  }, [pending, observer]);

  const localTime = useLocalTime(geo?.timezone);

  // If there's no pending selection and we are in single mode, or compare mode (with no confirmed Location A), hide the card.
  const showCard = mode === 'compare' ? (pending !== null || observer !== null) : (pending !== null);
  if (!showCard) return null;

  const isCompare = mode === 'compare';
  const isAConfirmed = observer !== null;

  let title = 'Selected location';
  let place = geo?.placeName ?? (loading ? 'LOCATING…' : 'Open water / remote');
  let confirmText = 'Confirm location ▸';

  if (isCompare) {
    if (!isAConfirmed) {
      title = 'Selected Location A';
      confirmText = 'Confirm Location A ▸';
    } else {
      if (pending === null) {
        title = 'Location A Confirmed';
        place = observer.placeName ?? 'Location A';
      } else {
        title = 'Selected Location B';
        confirmText = 'Confirm Location B ▸';
      }
    }
  }

  const handleConfirm = () => {
    confirm(geo?.placeName ?? undefined);
  };

  return (
    <div className="absolute right-4 top-4 z-20 w-[280px] max-w-[calc(100vw-2rem)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:right-6 sm:top-6" style={{ borderRadius: 6 }}>
      <div className="label text-[var(--interactive)] font-bold tracking-[0.16em] uppercase">{title}</div>
      <div className="mt-1 font-sans text-lg font-medium text-white line-clamp-3 leading-snug">{place}</div>

      {isCompare && isAConfirmed && pending === null ? (
        <div className="mt-4 font-mono text-[11px] leading-relaxed text-[var(--interactive)] animate-pulse uppercase tracking-[0.12em]">
          ● Select Location B on the globe...
        </div>
      ) : (
        <dl className="mt-4 space-y-2 font-mono text-[12px]">
          <Row 
            label="Coord" 
            value={formatLatLon(
              (pending ?? observer)?.latDeg ?? 0, 
              (pending ?? observer)?.lonDeg ?? 0
            )} 
            accent 
          />
          <Row label="Timezone" value={geo?.timezone ?? '—'} />
          <Row label="Local time" value={localTime} />
          <Row
            label="Elevation"
            value={geo?.elevationM != null ? `${Math.round(geo.elevationM)} m` : '—'}
          />
        </dl>
      )}

      {/* Only show confirm button if there is a pending location to confirm */}
      {pending !== null && (
        <button
          onClick={handleConfirm}
          className="mt-5 h-11 w-full bg-white font-mono text-[13px] uppercase tracking-[0.06em] text-black transition-colors hover:bg-zinc-200 cursor-pointer"
        >
          {confirmText}
        </button>
      )}

      {/* Show reset/re-pick option if anything is confirmed or pending */}
      {(pending !== null || isAConfirmed) && (
        <button
          onClick={clearPending}
          className="mt-2 h-9 w-full border border-[var(--border-visible)] font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)] transition-colors hover:text-white cursor-pointer"
        >
          {isCompare ? 'Reset Selection' : 'Re-pick'}
        </button>
      )}
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
