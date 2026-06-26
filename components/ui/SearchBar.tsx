'use client';

import { useEffect, useRef, useState } from 'react';
import { useZenith } from '@/store/useZenith';
import { geocode } from '@/lib/maptilerClient';
import type { MapTilerGeocodeFeature } from '@/types';

export function SearchBar() {
  const pick = useZenith((s) => s.pickLocation);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MapTilerGeocodeFeature[]>([]);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const f = await geocode(query);
      if (id === seq.current) {
        setResults(f.slice(0, 6));
        setOpen(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (f: MapTilerGeocodeFeature) => {
    const [lon, lat] = f.center;
    pick({ latDeg: lat, lonDeg: lon, elevationM: 0, placeName: f.placeName, source: 'search' });
    skip.current = true;
    setQ(f.placeName);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[360px] max-w-[calc(100vw-2rem)] -translate-x-1/2 sm:top-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search a place…"
        className="h-11 w-full border border-[var(--border-visible)] bg-[var(--surface)] px-4 font-mono text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-white/40"
      />
      {open && results.length > 0 && (
        <ul className="mt-1 max-h-[280px] overflow-auto border border-[var(--border-visible)] bg-[var(--surface)]">
          {results.map((f, i) => (
            <li key={`${f.placeName}-${i}`}>
              <button
                onClick={() => choose(f)}
                className="block w-full px-4 py-2.5 text-left font-mono text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {f.placeName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
