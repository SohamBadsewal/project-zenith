'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { FocusInfo } from '@/components/scene/SkyPlanetarium';
import { FACTS } from '@/data/facts';
import { lookupInfo, type ObjectInfo } from '@/data/objectInfo';

/**
 * Object dossier. Collapsed it's a small card bottom-left; expanded it grows into
 * a tall half-page panel with a hero image, stat grid, description and facts.
 * The small → large transition is a framer-motion layout animation.
 */
export function DetailPanel({ info, sidebarOpen }: { info: FocusInfo | null; sidebarOpen?: boolean }) {
  // `expanded` resets per object because the parent keys this component by id.
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();

  if (!info) return null;

  const rich = lookupInfo(info.id);
  const shortFact = info.id ? FACTS[info.id] : undefined;
  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 240, damping: 28, mass: 0.9 };

  // Check if this object only has the generic fallback dossier
  const isGeneric = !info.id || !rich || rich.summary.includes('A point of light');

  return (
    <motion.div
      layout
      transition={spring}
      className={`pointer-events-auto absolute z-30 flex flex-col overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md transition-[left] duration-300 ${
        sidebarOpen ? 'left-6 sm:left-[344px]' : 'left-6 sm:left-8'
      } ${
        expanded
          ? 'bottom-8 top-16 w-[min(560px,94vw)]'
          : 'bottom-10 h-auto w-[min(90vw,440px)]'
      }`}
      style={{ borderRadius: 6 }}
    >
      {/* Header — shared between states, drives the layout morph. */}
      <motion.div layout="position" className="shrink-0 px-5 pt-4">
        <div className="font-doto text-3xl font-medium leading-tight text-[var(--interactive)] sm:text-4xl">
          {info.name}
        </div>
        <div className="mt-1 font-doto text-[13px] text-[var(--text-secondary)]">{info.subtitle}</div>
        {info.blurb && (
          <div className="mt-2 font-doto text-[12px] leading-relaxed text-[var(--text-disabled)]">
            {info.blurb}
          </div>
        )}
      </motion.div>

      {/* More info / Collapse — pinned top-right of the card, only visible if not generic */}
      {!isGeneric && (
        <div className="absolute right-3 top-3 z-10">
          {expanded ? (
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full border border-[var(--border-visible)] bg-[var(--surface-raised)] px-4 py-1.5 font-doto text-[11px] font-bold uppercase tracking-wider text-[var(--interactive)] shadow-[0_0_8px_rgba(91,155,246,0.25)] transition-all hover:bg-[var(--interactive)] hover:text-white hover:shadow-[0_0_14px_rgba(91,155,246,0.5)]"
            >
              ▼ Collapse
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="rounded-full border border-[var(--border-visible)] bg-[var(--surface-raised)] px-4 py-1.5 font-doto text-[11px] font-bold uppercase tracking-wider text-[var(--interactive)] shadow-[0_0_8px_rgba(91,155,246,0.25)] transition-all hover:bg-[var(--interactive)] hover:text-white hover:shadow-[0_0_14px_rgba(91,155,246,0.5)] cursor-pointer"
            >
              ▲ More info
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false} mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            className="mt-3 min-h-0 flex-1 overflow-y-auto px-5 pb-5"
          >
            {rich ? (
              <RichBody rich={rich} reduce={!!reduce} />
            ) : (
              shortFact && <p className="font-doto text-[13px] leading-relaxed text-[var(--text-primary)]">{shortFact}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="px-5 pb-4 pt-3"
          >
            {shortFact && (
              <p className="font-doto text-[12px] leading-relaxed text-[var(--text-primary)] line-clamp-2">
                {shortFact}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RichBody({ rich, reduce }: { rich: ObjectInfo; reduce: boolean }) {
  const stagger = (i: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 + i * 0.06 } };

  return (
    <div className="space-y-4">
      <HeroImage key={rich.image ?? rich.fallbackImage ?? 'none'} src={rich.image} fallback={rich.fallbackImage} credit={rich.credit} />

      <motion.p {...stagger(0)} className="font-doto text-[14px] leading-relaxed text-[var(--text-primary)]">
        {rich.summary}
      </motion.p>

      {rich.stats.length > 0 && (
        <motion.div {...stagger(1)} className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[var(--border)] py-3">
          {rich.stats.map((s) => (
            <div key={s.label}>
              <div className="font-doto text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">{s.label}</div>
              <div className="font-doto text-[12px] text-[var(--text-primary)]">{s.value}</div>
            </div>
          ))}
        </motion.div>
      )}

      {rich.paragraphs.map((p, i) => (
        <motion.p key={i} {...stagger(2 + i)} className="font-doto text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {p}
        </motion.p>
      ))}

      {rich.facts.length > 0 && (
        <motion.div {...stagger(2 + rich.paragraphs.length)}>
          <div className="font-doto text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Did you know</div>
          <ul className="mt-2 space-y-1.5">
            {rich.facts.map((f) => (
              <li key={f} className="flex gap-2 font-doto text-[13px] leading-relaxed text-[var(--text-primary)]">
                <span className="text-[var(--interactive)]">›</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {rich.source && (
        <a
          href={rich.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-doto text-[10px] uppercase tracking-wider text-[var(--text-disabled)] underline-offset-2 hover:text-[var(--interactive)] hover:underline"
        >
          Source: {rich.source.label} ↗
        </a>
      )}
    </div>
  );
}

/** Hero image with a fallback chain: remote photo → local texture → hidden.
 *  Keyed by src in the parent, so it remounts (and resets) per object. */
function HeroImage({ src, fallback, credit }: { src?: string; fallback?: string; credit?: string }) {
  const [current, setCurrent] = useState(src ?? fallback);
  const [usedFallback, setUsedFallback] = useState(false);

  if (!current) return null;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-gradient-to-br from-[#0b1020] to-[#1a1330]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => {
          if (!usedFallback && fallback && current !== fallback) {
            setUsedFallback(true);
            setCurrent(fallback);
          } else {
            setCurrent(undefined);
          }
        }}
      />
      {credit && (
        <div className="absolute bottom-0 right-0 bg-black/55 px-1.5 py-0.5 font-doto text-[8px] text-white/70">
          {credit}
        </div>
      )}
    </div>
  );
}
