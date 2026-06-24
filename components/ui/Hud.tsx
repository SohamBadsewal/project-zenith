'use client';

import { useState } from 'react';
import { useZenith } from '@/store/useZenith';
import { formatLatLon } from '@/lib/geo';

/** Bottom-left coordinate readout + pick instruction + geolocation shortcut. */
export function Hud() {
  const pending = useZenith((s) => s.pending);
  const pickLocation = useZenith((s) => s.pickLocation);
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'denied'>('idle');

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState('idle');
        pickLocation({
          latDeg: pos.coords.latitude,
          lonDeg: pos.coords.longitude,
          elevationM: pos.coords.altitude ?? 0,
          source: 'geolocation',
        });
      },
      () => setGeoState('denied'),
      { timeout: 8000 },
    );
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="pointer-events-auto">
          <button
            onClick={useMyLocation}
            disabled={geoState === 'loading'}
            className="flex h-9 items-center gap-2 border border-[var(--border-visible)] bg-[var(--surface)] px-3 font-mono text-[12px] text-[var(--text-secondary)] transition-colors hover:text-white disabled:opacity-50"
          >
            {geoState === 'loading' ? (
              '⊙ LOCATING…'
            ) : geoState === 'denied' ? (
              '✕ LOCATION DENIED'
            ) : (
              '◎ USE MY LOCATION'
            )}
          </button>
        </div>
        <div className="font-mono text-[13px] text-[var(--interactive)]">
          {pending ? (
            formatLatLon(pending.latDeg, pending.lonDeg)
          ) : (
            <span className="text-[var(--text-disabled)]">LAT —  LON —</span>
          )}
        </div>
      </div>
      <div className="label hidden text-right sm:block text-[var(--text-disabled)]">
        click to pick · drag to rotate · scroll to zoom
      </div>
    </div>
  );
}
