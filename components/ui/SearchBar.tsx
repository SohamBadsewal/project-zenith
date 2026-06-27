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
    <div className="absolute left-1/2 top-4 z-20 w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 transition-all sm:top-6">
      <div className="relative flex items-center border border-zinc-700 bg-[#1a1a1a]/95 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.06),0_6px_30px_rgba(0,0,0,0.8)] focus-within:border-[var(--interactive)] focus-within:shadow-[0_0_20px_rgba(91,155,246,0.4)] transition-all duration-300" style={{ borderRadius: 6 }}>
        <span className="pl-4 text-[var(--interactive)] font-mono text-[14px]">⬡</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a place…"
          className="h-11 w-full bg-transparent pl-3 pr-4 font-mono text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="mt-1 max-h-[280px] overflow-auto border border-zinc-700 bg-[#1a1a1a]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)]" style={{ borderRadius: 6 }}>
          {results.map((f, i) => (
            <li key={`${f.placeName}-${i}`} className="border-b border-[var(--border)] last:border-0">
              <button
                onClick={() => choose(f)}
                className="block w-full px-4 py-3 text-left font-mono text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--interactive)]/10 hover:text-white"
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
