'use client';

import { useZenith } from '@/store/useZenith';

export function CompareToggle() {
  const mode = useZenith((s) => s.mode);
  const setMode = useZenith((s) => s.setMode);
  const phase = useZenith((s) => s.phase);
  const viewMode = useZenith((s) => s.viewMode);

  if (phase !== 'globe' || viewMode === 'freeview') return null;

  const toggleMode = () => {
    setMode(mode === 'single' ? 'compare' : 'single');
  };

  return (
    <div className="fixed left-4 top-20 z-50 pointer-events-auto sm:left-6 sm:top-20 transition-all duration-300">
      <button
        onClick={toggleMode}
        className="font-doto text-[16px] tracking-[0.16em] text-white/60 hover:text-white border border-white/35 hover:border-white px-5 py-2.5 transition-all duration-300 uppercase outline-none select-none bg-black/45 backdrop-blur-sm"
        style={{ borderRadius: 6 }}
        title={mode === 'single' ? 'Switch to Compare Mode' : 'Switch to Single Point Mode'}
      >
        {mode === 'single' ? 'SINGLE POINT' : 'COMPARE'}
      </button>
    </div>
  );
}
