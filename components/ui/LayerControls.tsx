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
    <details className="group absolute left-4 top-16 z-20 sm:left-6 sm:top-20" open>
      <summary className="label flex w-44 cursor-pointer list-none items-center justify-between border border-[var(--border-visible)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]">
        <span>Layers</span>
        <span className="text-[var(--text-disabled)] group-open:rotate-180">▾</span>
      </summary>
      <div className="w-44 border border-t-0 border-[var(--border-visible)] bg-[var(--surface)]">
        {ITEMS.map((it) => (
          <button
            key={it.key}
            onClick={() => setLayers({ ...layers, [it.key]: !layers[it.key] })}
            className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[12px] text-[var(--text-secondary)] transition-colors hover:text-white"
          >
            <span>{it.label}</span>
            <span
              className={
                layers[it.key] ? 'text-[var(--success)]' : 'text-[var(--text-disabled)]'
              }
            >
              {layers[it.key] ? '●' : '○'}
            </span>
          </button>
        ))}
      </div>
    </details>
  );
}
