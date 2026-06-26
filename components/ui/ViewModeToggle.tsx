'use client';

import { useZenith, type ViewMode } from '@/store/useZenith';

const MODES: Array<{ key: ViewMode; label: string }> = [
  { key: 'static', label: 'Static View' },
  { key: 'freeroam', label: 'Free Roam' },
];

export function ViewModeToggle() {
  const viewMode = useZenith((s) => s.viewMode);
  const setViewMode = useZenith((s) => s.setViewMode);

  return (
    <div className="absolute right-4 bottom-24 z-20 w-44 sm:right-6">
      <div className="label border border-[var(--border-visible)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]">
        Camera
      </div>
      <div className="border border-t-0 border-[var(--border-visible)] bg-[var(--surface)]">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setViewMode(m.key)}
            className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[12px] text-[var(--text-secondary)] transition-colors hover:text-white"
          >
            <span>{m.label}</span>
            <span className={viewMode === m.key ? 'text-[var(--success)]' : 'text-[var(--text-disabled)]'}>
              {viewMode === m.key ? '●' : '○'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
