'use client';

import { useEffect, useRef } from 'react';
import { useZenith } from '@/store/useZenith';
import { audio } from './audio';

const dragWindow = () => Math.max(280, window.innerHeight * 0.42);
const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HeroHud() {
  const launch = useZenith((s) => s.launch);
  const tension = useZenith((s) => s.tension);
  const beginLaunch = useZenith((s) => s.beginLaunch);
  const armDrag = useZenith((s) => s.armDrag);
  const setTension = useZenith((s) => s.setTension);
  const releaseDrag = useZenith((s) => s.releaseDrag);

  const btnRef = useRef<HTMLButtonElement>(null);
  const startY = useRef(0);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onIgniteCta = () => {
    audio.resume();
    beginLaunch(btnRef.current!.getBoundingClientRect());
  };

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

  const showIntro = launch === 'idle';
  const showDrag = launch === 'armed' || launch === 'dragging';

  return (
    <>
      {showIntro && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-center p-8 sm:p-16">
          <div className="max-w-lg">
            <div className="label text-[var(--text-secondary)]">Project Zenith</div>
            <h1 className="mt-3 font-sans text-4xl font-medium leading-tight text-white sm:text-6xl" style={{ textWrap: 'balance' }}>
              Begin the ascent
            </h1>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-[var(--text-secondary)]" style={{ textWrap: 'pretty' }}>
              Launch to orbit, then choose any point on Earth to read the sky passing through its zenith right now.
            </p>
            <button
              ref={btnRef}
              onClick={onIgniteCta}
              className="pointer-events-auto mt-8 h-12 border border-white/20 bg-white/[0.06] px-7 font-mono text-[13px] uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors duration-300 ease-out hover:border-white/40"
            >
              Initiate launch ▸
            </button>
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
          <div className="pointer-events-none absolute inset-x-0 bottom-14 flex flex-col items-center gap-4 text-center">
            <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[color:rgba(180,200,225,0.6)]">
              Drag upward to build thrust
            </div>
            <button
              onClick={autoThrust}
              className="pointer-events-auto h-10 border border-white/20 bg-white/[0.06] px-5 font-mono text-[12px] uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-colors hover:border-white/40"
            >
              ▲ Tap to ignite
            </button>
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
