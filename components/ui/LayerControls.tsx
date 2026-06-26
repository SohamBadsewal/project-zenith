'use client';

import type { Layers } from '@/components/scene/SkyPlanetarium';

const ITEMS: Array<{ key: keyof Layers; label: string }> = [
  { key: 'stars', label: 'Stars' },
  { key: 'constellations', label: 'Constellations' },
  { key: 'planets', label: 'Planets · Sun · Moon' },
  { key: 'satellites', label: 'Satellites · ISS' },
  { key: 'labels', label: 'Labels' },
];

/** "Specific dropdowns" — everything is ON by default; these filter DOWN. */
export function LayerControls({
  layers,
  setLayers,
}: {
  layers: Layers;
  setLayers: (l: Layers) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <span className="label text-[var(--text-primary)]">Layers</span>
      </div>
      {ITEMS.map((it) => (
        <button
          key={it.key}
          onClick={() => setLayers({ ...layers, [it.key]: !layers[it.key] })}
          className="flex w-full items-center justify-between border-b border-[var(--border)] px-4 py-2 text-left font-mono text-[12px] text-[var(--text-secondary)] transition-colors hover:text-white"
        >
          <span>{it.label}</span>
          <span className={layers[it.key] ? 'text-[var(--success)]' : 'text-[var(--text-disabled)]'}>
            {layers[it.key] ? '●' : '○'}
          </span>
        </button>
      ))}
    </div>
  );
}
