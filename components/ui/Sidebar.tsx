'use client';

import { useState } from 'react';
import type { SkyData } from '@/hooks/useSky';
import type { Layers } from '@/components/scene/SkyPlanetarium';
import { LayerControls } from './LayerControls';
import { OverheadPanel } from './OverheadPanel';

export function Sidebar({
  layers,
  setLayers,
  data,
  selectionId,
  onSelect,
}: {
  layers: Layers;
  setLayers: (l: Layers) => void;
  data: SkyData;
  selectionId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close panel' : 'Open panel'}
        aria-expanded={open}
        className="absolute left-4 top-16 z-40 flex h-10 w-10 items-center justify-center border border-[var(--border-visible)] bg-[var(--surface)] font-mono text-[16px] text-[var(--text-primary)] transition-colors hover:text-white sm:left-6"
      >
        {open ? '✕' : '☰'}
      </button>

      <aside
        aria-hidden={!open}
        className={`absolute left-0 top-0 bottom-0 z-30 flex w-[320px] max-w-[85vw] transform flex-col border-r border-[var(--border-visible)] bg-[var(--surface)] pt-28 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <LayerControls layers={layers} setLayers={setLayers} />
          <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-[var(--border-visible)]">
            <OverheadPanel data={data} selectionId={selectionId} onSelect={onSelect} />
          </div>
        </div>
      </aside>
    </>
  );
}
