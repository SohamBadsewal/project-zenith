'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZenith } from '@/store/useZenith';

export function SkyGuideCard() {
  const viewMode = useZenith((s) => s.viewMode) as string;
  const [isOpen, setIsOpen] = useState(true);

  // If in Free View mode, we hide the guide card entirely to show only the space view!
  if (viewMode === 'freeview') return null;

  return (
    <div className="absolute right-4 top-16 z-20 sm:right-6 sm:top-20">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="guide-card"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            className="w-[300px] border border-zinc-700 bg-[#1a1a1a]/95 p-5 shadow-[0_0_20px_rgba(255,255,255,0.06),0_6px_30px_rgba(0,0,0,0.8)]"
            style={{ borderRadius: 6 }}
          >
            {/* Header with Close option on the LEFT */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <button
                onClick={() => setIsOpen(false)}
                className="font-mono text-[14px] text-zinc-400 hover:text-white transition-colors leading-none pr-1.5"
                title="Collapse guide"
              >
                ✕
              </button>
              <span className="label text-[var(--interactive)] font-bold tracking-[0.16em] uppercase flex-1">Camera Mode</span>
              <span className="font-mono text-[11px] font-bold text-[var(--success)] uppercase tracking-[0.12em] animate-pulse">
                ● {viewMode === 'static' ? 'Static' : 'Roam'}
              </span>
            </div>

            <div className="mt-3 font-sans text-md font-medium text-white">Sky Viewing Guide:</div>

            <ul className="mt-3 space-y-3.5 font-mono text-[12px] text-[var(--text-secondary)]">
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={viewMode === 'static' ? 'text-[var(--success)]' : 'text-zinc-600'}>●</span>
                  <strong className="text-white">Static View (Zenith Lock):</strong>
                </div>
                <div className="pl-4">
                  Locks the camera looking straight up. Ideal for watching planets, stars, and satellites cross directly overhead.
                </div>
              </li>
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={viewMode === 'freeroam' ? 'text-[var(--success)]' : 'text-zinc-600'}>●</span>
                  <strong className="text-white">Free Roam (Dynamic):</strong>
                </div>
                <div className="pl-4">
                  Drag to pan around the sky sphere and scroll to zoom. Clicking any object aligns the camera to it; drag to break the lock.
                </div>
              </li>
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={viewMode === 'freeview' ? 'text-[var(--success)]' : 'text-zinc-600'}>●</span>
                  <strong className="text-white">Free View (Space Only):</strong>
                </div>
                <div className="pl-4">
                  Hides all UI elements for an immersive sky viewing experience. Hover at the bottom of the screen to reveal the exit button.
                </div>
              </li>
            </ul>
          </motion.div>
        ) : (
          <motion.button
            key="guide-trigger"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="flex h-10 w-10 items-center justify-center border border-zinc-700 bg-[#1a1a1a]/95 text-[var(--interactive)] shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-white hover:text-white transition-all duration-300"
            style={{ borderRadius: 6 }}
            title="Open camera guide"
          >
            <span className="font-mono text-[16px] leading-none">◀</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
