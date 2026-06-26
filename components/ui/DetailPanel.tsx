'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { FocusInfo } from '@/components/scene/SkyPlanetarium';
import { FACTS } from '@/data/facts';

/**
 * Two-state info panel: a collapsed mini-card by default; drag up (or tap the
 * chevron) expands it into a larger panel with the curated fact. Resets to
 * collapsed whenever the focused object changes.
 */
export function DetailPanel({ info }: { info: FocusInfo | null }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);

  // Reset to collapsed + play a small entrance when the focused object changes.
  useEffect(() => {
    setExpanded(false);
    const el = panelRef.current;
    if (el) gsap.fromTo(el, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  }, [info?.id]);

  if (!info) return null;

  const fact = info.id ? FACTS[info.id] : undefined;

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current == null) return;
    const dy = dragStartY.current - e.clientY; // up = positive
    if (dy > 40 && !expanded) setExpanded(true);
    if (dy < -40 && expanded) setExpanded(false);
  };
  const onPointerUp = () => { dragStartY.current = null; };

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute bottom-10 left-6 z-30 max-w-[min(90vw,440px)] overflow-hidden border border-[var(--border-visible)] bg-[var(--surface)]/95 backdrop-blur-sm sm:left-8"
      style={{ borderRadius: 4 }}
    >
      {/* Drag handle */}
      <div
        className="flex cursor-grab touch-none items-center justify-center py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-[var(--border-visible)]" />
      </div>

      <div className="px-5 pb-4">
        <div className="font-sans text-3xl font-medium leading-tight text-[var(--interactive)] sm:text-4xl">
          {info.name}
        </div>
        <div className="mt-1 font-mono text-[13px] text-[var(--text-secondary)]">{info.subtitle}</div>
        {info.blurb && (
          <div className="mt-2 font-mono text-[12px] leading-relaxed text-[var(--text-disabled)]">{info.blurb}</div>
        )}

        {expanded ? (
          <>
            {fact && (
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Did you know</div>
                <div className="mt-1 font-sans text-[13px] leading-relaxed text-[var(--text-primary)]">{fact}</div>
              </div>
            )}
            <button
              onClick={() => setExpanded(false)}
              className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-disabled)] hover:text-white"
            >
              ▼ drag down to collapse
            </button>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] hover:text-white"
          >
            ▲ More info
          </button>
        )}
      </div>
    </div>
  );
}
