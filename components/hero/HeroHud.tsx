'use client';

import { useEffect, useRef } from 'react';
import { useZenith } from '@/store/useZenith';
import { LaunchButton } from './LaunchButton';

const dragWindow = () => Math.max(280, window.innerHeight * 0.42);
const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HeroHud() {
  const launch = useZenith((s) => s.launch);
  const tension = useZenith((s) => s.tension);
  const armDrag = useZenith((s) => s.armDrag);
  const setTension = useZenith((s) => s.setTension);
  const releaseDrag = useZenith((s) => s.releaseDrag);

  const startY = useRef(0);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    armDrag();
    startY.current = e.clientY;
  };
  const onMove = (e: React.PointerEvent) => {
    if (useZenith.getState().launch !== 'dragging') return;
    setTension((startY.current - e.clientY) / dragWindow());
  };
  const onUp = () => {
    cancelAnimationFrame(raf.current);
    if (useZenith.getState().launch === 'dragging') releaseDrag();
  };

  const autoThrust = () => {
    armDrag();
    if (prefersReduced()) {
      useZenith.getState().fireLaunch();
      return;
    }
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 1100);
      setTension(k);
      if (k < 1 && useZenith.getState().launch === 'dragging') raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  if (launch === 'launched') return null;

  const showIntro = launch === 'idle' || launch === 'magnifying';
  const showDrag = launch === 'armed' || launch === 'dragging';

  return (
    <>
      {showIntro && (
        <div
          className={`pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-700 ease-out sm:p-16 ${
            launch === 'magnifying' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="font-doto text-[var(--interactive)] text-3xl sm:text-5xl lg:text-6xl tracking-[0.2em] font-bold uppercase mb-4">Project Zenith</div>
            <h1
              className="mt-3 text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
              style={{ fontFamily: 'var(--font-doto), monospace', textWrap: 'balance', letterSpacing: '0.04em' }}
            >
              Begin the ascent
            </h1>
            <p className="mt-6 max-w-lg font-doto text-[16px] sm:text-[18px] leading-relaxed text-white/80 tracking-[0.04em]" style={{ textWrap: 'pretty' }}>
              Launch to orbit, then choose any point on Earth to read the sky passing through its zenith right now.
            </p>
            
            {/* Mobile landscape/desktop suggestion warning */}
            <div className="mt-6 block sm:hidden font-doto text-[11px] leading-relaxed text-[var(--interactive)] uppercase tracking-[0.16em] animate-pulse select-none px-4">
              [ Rotate to landscape and use desktop view in browser for the best experience ]
            </div>

            <div className="pointer-events-auto mt-8 flex flex-col items-center">
              <LaunchButton />
              <div
                className="mt-4 animate-pulse font-mono text-[11px] uppercase tracking-[0.22em] text-white/50"
              >
                ↑ hover over the button ↑
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-doto text-[14px] uppercase tracking-[0.22em] text-white/65 whitespace-nowrap select-none pointer-events-none">
            Press F11 to full screen for enhanced experience
          </div>
        </div>
      )}

      {showDrag && (
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`absolute inset-0 z-30 touch-none ${launch === 'dragging' ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-14 flex flex-col items-center text-center">
            <div className="inline-block bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.4)] select-none">
              <div className="font-doto text-[13px] sm:text-[14px] font-black uppercase tracking-[0.2em] text-[var(--interactive)] animate-pulse">
                slowly hold and drag upwards to build thrust
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute right-8 top-1/2 h-[180px] w-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 transition-opacity duration-300"
            style={{ opacity: launch === 'dragging' ? 0.95 : 0.25 }}
          >
            <div
              className="absolute bottom-0 left-0 w-full rounded-full"
              style={{ height: `${tension * 100}%`, background: 'linear-gradient(to top, #ff6a18, #ffd86a)' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
