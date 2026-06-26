'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useZenith } from '@/store/useZenith';
import { useSky } from '@/hooks/useSky';
import { Globe } from '@/components/scene/Globe';
import { Starfield } from '@/components/scene/Starfield';
import { SkyPlanetarium, type Layers } from '@/components/scene/SkyPlanetarium';
import { CinematicCamera } from '@/components/scene/CinematicCamera';
import { Hud } from '@/components/ui/Hud';
import { LocationCard } from '@/components/ui/LocationCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { LayerControls } from '@/components/ui/LayerControls';
import { OverheadPanel } from '@/components/ui/OverheadPanel';
import { formatLatLon } from '@/lib/geo';
import { buildShareHash, parseShareHash } from '@/lib/shareUrl';

const DEFAULT_LAYERS: Layers = {
  stars: true,
  constellations: true,
  planets: true,
  satellites: true,
  labels: true,
};

export default function Page() {
  const phase = useZenith((s) => s.phase);
  const observer = useZenith((s) => s.observer);
  const selectionId = useZenith((s) => s.selectionId);
  const select = useZenith((s) => s.select);
  const setPhase = useZenith((s) => s.setPhase);
  const time = useZenith((s) => s.time);

  const [mounted, setMounted] = useState(false);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [copied, setCopied] = useState(false);
  const sky = useSky();
  const hashWritten = useRef(false);

  useEffect(() => setMounted(true), []);

  // Restore sky state from URL hash on first mount.
  useEffect(() => {
    if (!mounted) return;
    const params = parseShareHash(window.location.hash);
    if (!params) return;
    useZenith.setState({
      observer: {
        latDeg: params.latDeg,
        lonDeg: params.lonDeg,
        elevationM: 0,
        source: 'globe',
      },
      phase: 'sky',
      time: {
        liveEpochMs: params.epochMs,
        scrubOffsetMs: 0,
      },
    });
  }, [mounted]);

  // Write hash when entering sky phase.
  useEffect(() => {
    if (phase !== 'sky' || !observer) return;
    if (hashWritten.current) return;
    hashWritten.current = true;
    const epochMs = time.liveEpochMs + time.scrubOffsetMs;
    window.location.hash = buildShareHash(observer.latDeg, observer.lonDeg, epochMs).slice(1);
  }, [phase, observer, time]);

  // Reset hash flag on leaving sky.
  useEffect(() => {
    if (phase !== 'sky') hashWritten.current = false;
  }, [phase]);

  // The 'descent' phase is the cinematic reveal window; CinematicCamera flies
  // the camera into the sphere and calls setPhase('sky') when it completes.
  // (Shared-link restores set phase straight to 'sky', skipping the reveal.)

  const inSky = phase === 'sky' || phase === 'descent';

  const goBack = () => {
    window.location.hash = '';
    useZenith.setState({
      phase: 'globe',
      observer: null,
      pending: null,
      sky: null,
      selectionId: null,
    });
  };

  const copyShareLink = () => {
    if (!observer) return;
    const epochMs = time.liveEpochMs + time.scrubOffsetMs;
    const hash = buildShareHash(observer.latDeg, observer.lonDeg, epochMs);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {mounted && !inSky && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 3, 5]} intensity={2.2} />
          <directionalLight position={[-5, -3, -5]} intensity={0.4} />
          <Starfield />
          <Globe />
          <OrbitControls enablePan={false} minDistance={1.4} maxDistance={5} enableDamping />
        </Canvas>
      )}

      {mounted && inSky && (
        <Canvas camera={{ position: [0, 0, 0.1], fov: 70 }}>
          <Starfield count={1500} radius={60} />
          <SkyPlanetarium data={sky} layers={layers} selectionId={selectionId} onSelect={select} />
          <CinematicCamera active={phase === 'descent'} onDone={() => setPhase('sky')} />
          {phase === 'sky' && (
            <OrbitControls
              enablePan={false}
              enableZoom
              rotateSpeed={-0.4}
              minDistance={0.1}
              maxDistance={2}
              enableDamping
              dampingFactor={0.12}
            />
          )}
        </Canvas>
      )}

      {/* ── Globe-phase chrome ── */}
      {!inSky && (
        <>
          {phase === 'landing' && <LandingHero onStart={() => setPhase('globe')} />}
          {phase === 'globe' && (
            <>
              <Hud />
              <SearchBar />
              <LocationCard />
            </>
          )}
        </>
      )}

      {/* ── Sky-phase chrome ── */}
      {inSky && (
        <>
          {/* Back button */}
          <button
            onClick={goBack}
            className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center border border-[var(--border-visible)] bg-[var(--surface)] font-mono text-[var(--text-primary)] sm:left-6 sm:top-6"
            aria-label="Back to globe"
          >
            ‹
          </button>

          {/* Location label */}
          {observer && (
            <div className="absolute left-16 top-4 z-20 font-mono text-[12px] text-[var(--text-secondary)] sm:left-20 sm:top-7">
              ◐ {observer.placeName ?? formatLatLon(observer.latDeg, observer.lonDeg)}
            </div>
          )}

          <LayerControls layers={layers} setLayers={setLayers} />

          {/* Share link button — bottom-left, away from LayerControls */}
          <button
            onClick={copyShareLink}
            className="absolute bottom-6 left-4 z-20 flex h-8 items-center gap-1.5 border border-[var(--border-visible)] bg-[var(--surface)] px-3 font-mono text-[11px] text-[var(--text-secondary)] transition-colors hover:text-white sm:left-6 sm:bottom-8"
            title="Copy shareable link to this sky view"
          >
            {copied ? '✓ COPIED' : '⬡ SHARE SKY'}
          </button>
          <OverheadPanel data={sky} selectionId={selectionId} onSelect={select} />
        </>
      )}
    </main>
  );
}

function LandingHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center p-8 sm:p-16">
      <div className="max-w-lg">
        <div className="label text-[var(--text-secondary)]">Project Zenith</div>
        <h1 className="mt-3 font-sans text-4xl font-medium leading-tight text-white sm:text-6xl">
          The Celestial Eye
        </h1>
        <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-[var(--text-secondary)]">
          Pick any point on Earth and see the planets, stars, constellations and
          satellites passing through its zenith right now.
        </p>
        <button
          onClick={onStart}
          className="pointer-events-auto mt-8 h-12 border border-white/20 bg-white/[0.06] px-7 font-mono text-[13px] uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:border-white/40"
        >
          Start exploring ▸
        </button>
      </div>
    </div>
  );
}
