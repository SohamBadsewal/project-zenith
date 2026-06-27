'use client';

import { useZenith, type ViewMode } from '@/store/useZenith';

const MODES: Array<{ key: ViewMode; label: string }> = [
  { key: 'static', label: 'Static View' },
  { key: 'freeroam', label: 'Free Roam' },
  { key: 'freeview', label: 'Free View' },
];

export function ViewModeToggle() {
  const viewMode = useZenith((s) => s.viewMode) as string;
  const setViewMode = useZenith((s) => s.setViewMode);

  // If in freeroam or freeview, it hides by default and reveals only on hover.
  // If in static view (the initial state), it is always fully visible.
  const isHoverOnly = viewMode === 'freeroam' || viewMode === 'freeview';

  return (
    <div className="absolute right-4 bottom-24 z-30 p-4 -mr-4 -mb-4 group pointer-events-auto sm:right-6">
      {/* Subtle indicator hint to guide user hover (only visible in hover-only modes) */}
      {isHoverOnly && (
        <div className="opacity-30 group-hover:opacity-0 transition-opacity duration-300 font-mono text-[10px] text-white/50 text-right pr-2 pointer-events-none select-none">
          [ Hover Camera ]
        </div>
      )}

      <div
        className={`mt-1 w-44 border border-[var(--border-visible)] bg-[var(--surface)] transition-opacity duration-300 ${
          isHoverOnly
            ? 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
            : 'opacity-100 pointer-events-auto'
        }`}
        style={{ borderRadius: 6 }}
      >
        <div className="label px-3 py-2 border-b border-[var(--border-visible)] text-[var(--text-primary)] font-bold">
          Camera
        </div>
        <div>
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
    </div>
  );
}
