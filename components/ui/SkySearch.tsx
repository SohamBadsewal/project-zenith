'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { SkyData } from '@/hooks/useSky';
import { DSOS } from '@/hooks/useSky';
import type { Layers } from '@/components/scene/SkyPlanetarium';
import { useZenith } from '@/store/useZenith';

interface SearchItem {
  id: string;
  name: string;
  type: 'planet' | 'star' | 'satellite' | 'dso' | 'constellation';
  subtitle: string;
  keywords: string[];
}

// Detailed semantic mappings for celestial objects
const SEMANTIC_DICT: Record<string, string[]> = {
  // Planets & Solar System
  'planet:mars': ['red planet', 'fourth planet', 'desert', 'rusty', 'volcano', 'olympus mons', 'alions', 'mars'],
  'planet:venus': ['hottest planet', 'greenhouse', 'venus', 'morning star', 'evening star', 'hottest', 'acid'],
  'planet:mercury': ['closest to sun', 'mercury', 'smallest planet', 'cratered', 'extreme temperatures'],
  'planet:jupiter': ['largest planet', 'gas giant', 'jupiter', 'great red spot', 'storm', 'moons', 'europa'],
  'planet:saturn': ['rings', 'saturn', 'ringed planet', 'float', 'titan', 'enceladus'],
  'planet:uranus': ['rolling planet', 'sideways', 'uranus', 'ice giant', 'tipped', 'blue-green'],
  'planet:neptune': ['windiest planet', 'neptune', 'fastest winds', 'distant', 'ice giant', 'triton'],
  sun: ['our sun', 'solar wind', 'aurora', 'center', 'yellow dwarf', 'hot plasma', 'light'],
  moon: ['luna', 'tides', 'drifting', 'craters', 'apollo', 'lunar', 'orbit', 'phase'],

  // Satellites
  'sat:25544': ['iss', 'international space station', 'astronauts', 'crew', 'orbiting lab', 'space station'],
  'sat:20580': ['hubble', 'space telescope', 'hst', 'mirror', 'nasa telescope', 'deep field'],

  // Bright Stars
  'star:HR32349': ['sirius', 'brightest star', 'dog star', 'binary', 'white dwarf', 'companion'],
  'star:HR91262': ['vega', 'zero magnitude', 'pole star', 'egg shaped', 'summer triangle'],
  'star:HR27989': ['betelgeuse', 'supernova', 'red supergiant', 'orion', 'dimming star', 'shoulder'],
  'star:HR24436': ['rigel', 'blue supergiant', 'orion', 'luminous', 'foot', 'brightest orion star'],
  'star:HR11767': ['polaris', 'north star', 'pole star', 'navigation', 'compass', 'true north'],
  'star:HR80763': ['antares', 'rival of mars', 'red supergiant', 'scorpion', 'scorpius'],
  'star:HR30438': ['canopus', 'second brightest', 'navigation', 'probe', 'deep space'],
  'star:HR69673': ['arcturus', 'proper motion', 'orange giant', 'bootes'],
  'star:HR71683': ['alpha centauri', 'nearest star', 'proxima', 'exoplanet', 'neighbor'],

  // Deep Sky Objects
  'dso:M42': ['orion nebula', 'stellar nursery', 'star birth', 'newborn', 'm42', 'nebula'],
  'dso:M45': ['pleiades', 'seven sisters', 'subaru', 'cluster', 'blue stars', 'm45'],
  'dso:M44': ['beehive', 'praesepe', 'cluster', 'exoplanets', 'm44'],
  'dso:M13': ['hercules', 'globular cluster', 'arecibo message', 'interstellar broadcast', 'm13'],
  'dso:M57': ['ring nebula', 'dying star', 'white dwarf', 'shell', 'donut', 'm57'],

  // Constellations
  'con:Ori': ['orion', 'the hunter', 'belt', 'betelgeuse rigel'],
  'con:UMa': ['ursa major', 'big dipper', 'pointer', 'great bear', 'plow'],
  'con:UMi': ['ursa minor', 'little dipper', 'polaris', 'little bear'],
  'con:Cas': ['cassiopeia', 'queen', 'w shape'],
  'con:Cyg': ['cygnus', 'the swan', 'northern cross', 'deneb'],
  'con:Lyr': ['lyra', 'the harp', 'vega'],
  'con:Sco': ['scorpius', 'the scorpion', 'antares', 'sting'],
  'con:Tau': ['taurus', 'the bull', 'aldebaran', 'pleiades']
};

export function SkySearch({
  data,
  layers,
  setLayers,
  onSelect,
}: {
  data: SkyData | null;
  layers: Layers;
  setLayers: (l: Layers) => void;
  onSelect: (id: string | null) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);

  // Build the static + dynamic index of searchable objects
  const searchIndex = useMemo<SearchItem[]>(() => {
    if (!data) return [];
    const items: SearchItem[] = [];

    // Planets, Sun, Moon
    data.bodies.forEach((b) => {
      if (b.kind === 'sun' || b.kind === 'moon' || b.kind === 'planet') {
        const subtype = b.kind === 'sun' ? 'Star' : b.kind === 'moon' ? 'Moon' : 'Planet';
        items.push({
          id: b.id,
          name: b.name,
          type: 'planet',
          subtitle: `${subtype} · Solar System`,
          keywords: SEMANTIC_DICT[b.id] || [],
        });
      }
    });

    // Satellites
    data.satellites.forEach((s) => {
      const id = `sat:${s.noradId}`;
      const subtitle = s.noradId === 25544 ? 'International Space Station' : 'Space Telescope';
      items.push({
        id,
        name: s.name.replace(/\s*\(.*\)$/, ''),
        type: 'satellite',
        subtitle: `${subtitle} · Orbit`,
        keywords: SEMANTIC_DICT[id] || [],
      });
    });

    // Constellations
    data.constellations.forEach((c) => {
      const id = `con:${c.id}`;
      items.push({
        id,
        name: c.name,
        type: 'constellation',
        subtitle: 'Constellation · Figure',
        keywords: SEMANTIC_DICT[id] || [],
      });
    });

    // Deep Sky Objects (DSOs)
    DSOS.forEach((d) => {
      const id = `dso:${d.id}`;
      items.push({
        id,
        name: d.name,
        type: 'dso',
        subtitle: `${d.type.charAt(0).toUpperCase() + d.type.slice(1)} · Deep Sky`,
        keywords: SEMANTIC_DICT[id] || [],
      });
    });

    // Stars
    data.stars.forEach((s) => {
      items.push({
        id: s.id,
        name: s.name,
        type: 'star',
        subtitle: `Star in ${s.con || 'Sky'}`,
        keywords: SEMANTIC_DICT[s.id] || [],
      });
    });

    return items;
  }, [data]);

  // Semantic search query resolver
  useEffect(() => {
    const query = q.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const queryWords = query.split(/\s+/);

    const scored = searchIndex
      .map((item) => {
        let score = 0;
        const nameLower = item.name.toLowerCase();
        const subLower = item.subtitle.toLowerCase();

        // 1. Direct name matches
        if (nameLower === query) score += 100;
        else if (nameLower.startsWith(query)) score += 60;
        else if (nameLower.includes(query)) score += 30;

        // 2. Word matches in name
        queryWords.forEach((word) => {
          if (nameLower.includes(word)) score += 15;
        });

        // 3. Keyword / semantic concept matches
        item.keywords.forEach((keyword) => {
          if (keyword === query) score += 50;
          else if (keyword.includes(query)) score += 20;

          // Check individual word matches in synonyms
          queryWords.forEach((word) => {
            if (keyword.includes(word)) score += 10;
          });
        });

        // 4. Subtitle / Type matches
        if (subLower.includes(query)) score += 10;

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);

    setResults(scored.slice(0, 6));
  }, [q, searchIndex]);

  const choose = (item: SearchItem) => {
    // Make sure the target layer is turned on so the user can see it!
    const updatedLayers = { ...layers };
    if (item.type === 'star') updatedLayers.stars = true;
    else if (item.type === 'dso') updatedLayers.stars = true;
    else if (item.type === 'constellation') updatedLayers.constellations = true;
    else if (item.type === 'planet') updatedLayers.planets = true;
    else if (item.type === 'satellite') updatedLayers.satellites = true;
    setLayers(updatedLayers);

    onSelect(item.id);
    useZenith.getState().setViewMode('freeroam');
    setQ(item.name);
    setOpen(false);
  };

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[380px] max-w-[calc(100vw-8.5rem)] -translate-x-1/2 transition-all sm:top-6">
      <div className="relative flex items-center border border-zinc-700 bg-[#1a1a1a]/95 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.06),0_6px_30px_rgba(0,0,0,0.8)] focus-within:border-[var(--interactive)] focus-within:shadow-[0_0_20px_rgba(91,155,246,0.4)] transition-all duration-300" style={{ borderRadius: 6 }}>
        <span className="pl-4 text-[var(--interactive)] font-mono text-[14px]">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search stars, constellations, planets…"
          className="h-11 w-full bg-transparent pl-3 pr-4 font-mono text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
        {q && (
          <button
            onClick={() => { setQ(''); setResults([]); }}
            className="pr-4 font-mono text-[11px] text-[var(--text-secondary)] hover:text-white"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="mt-1 max-h-[280px] overflow-auto border border-zinc-700 bg-[#1a1a1a]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)]" style={{ borderRadius: 6 }}>
          {results.map((item, i) => (
            <li key={`${item.id}-${i}`} className="border-b border-[var(--border)] last:border-0">
              <button
                onClick={() => choose(item)}
                className="block w-full px-4 py-3 text-left transition-colors hover:bg-[var(--interactive)]/10"
              >
                <div className="font-mono text-[12px] text-white font-bold">{item.name}</div>
                <div className="font-mono text-[10px] text-[var(--text-secondary)] mt-0.5">{item.subtitle}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
