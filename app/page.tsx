'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import gsap from 'gsap';
import { useZenith } from '@/store/useZenith';
import { useSky } from '@/hooks/useSky';
import { Globe } from '@/components/scene/Globe';
import { Starfield } from '@/components/scene/Starfield';
import { SkyPlanetarium, type Layers, type FocusInfo } from '@/components/scene/SkyPlanetarium';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { TransitionRig } from '@/components/scene/TransitionRig';
import { StaticCamera } from '@/components/scene/StaticCamera';
import { Hud } from '@/components/ui/Hud';
import { LocationCard } from '@/components/ui/LocationCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Sidebar } from '@/components/ui/Sidebar';
import { ViewModeToggle } from '@/components/ui/ViewModeToggle';
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
  const viewMode = useZenith((s) => s.viewMode);
  const time = useZenith((s) => s.time);

  const [mounted, setMounted] = useState(false);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [focusInfo, setFocusInfo] = useState<FocusInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const sky = useSky();
  const hashWritten = useRef(false);
  const tRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

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
      time: { liveEpochMs: params.epochMs, scrubOffsetMs: 0 },
    });
  }, [mounted]);

  useEffect(() => {
    if (phase !== 'descent') return;
    tRef.current = 0;
    const proxy = { t: 0 };
    const tween = gsap.to(proxy, {
      t: 1,
      duration: 1.4,
      ease: 'power2.in',
      onUpdate: () => {
        tRef.current = proxy.t;
      },
    });
    if (overlayRef.current) overlayRef.current.style.opacity = '1';
    const done = setTimeout(() => setPhase('sky'), 1400);
    return () => {
      tween.kill();
      clearTimeout(done);
    };
  }, [phase, setPhase]);

  useEffect(() => {
    if (phase !== 'sky') return;
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
  }, [phase]);

  useEffect(() => {
    if (phase !== 'sky' || !observer) return;
    if (hashWritten.current) return;
    hashWritten.current = true;
    const epochMs = time.liveEpochMs + time.scrubOffsetMs;
    window.location.hash = buildShareHash(observer.latDeg, observer.lonDeg, epochMs).slice(1);
  }, [phase, observer, time]);

  useEffect(() => {
    if (phase !== 'sky') hashWritten.current = false;
  }, [phase]);

  const showGlobe = phase === 'landing' || phase === 'globe' || phase === 'descent';
  const showSky = phase === 'sky';

  const goBack = () => {
    window.location.hash = '';
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
    setFocusInfo(null);
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
      {mounted && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          {showGlobe && (
            <>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 3, 5]} intensity={2.2} />
              <directionalLight position={[-5, -3, -5]} intensity={0.4} />
              <Starfield />
              <Globe />
            </>
          )}

          {showSky && (
            <>
              <SkyPlanetarium data={sky} layers={layers} selectionId={selectionId} onSelect={select} onFocus={setFocusInfo} />
              <EffectComposer>
                <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.85} intensity={0.7} radius={0.5} mipmapBlur />
              </EffectComposer>
            </>
          )}

          <TransitionRig phase={phase} tRef={tRef} />

          {phase === 'globe' && (
            <OrbitControls makeDefault enablePan={false} minDistance={1.4} maxDistance={5} enableDamping />
          )}
          {phase === 'sky' && viewMode === 'static' && <StaticCamera />}
          {phase === 'sky' && viewMode === 'freeroam' && (
            <OrbitControls
              makeDefault
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

      <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-40 bg-black opacity-0 transition-opacity duration-1000 ease-in-out" />

      {phase === 'landing' && <LandingHero onStart={() => setPhase('globe')} />}

      {phase === 'globe' && (
        <>
          <Hud />
          <SearchBar />
          <LocationCard />
        </>
      )}

      {phase === 'sky' && (
        <>
          <button
            onClick={goBack}
            className="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center border border-[var(--border-visible)] bg-[var(--surface)] font-mono text-[var(--text-primary)] transition-colors hover:text-white sm:right-6 sm:top-6"
            aria-label="Back to globe"
          >
            ‹
          </button>

          {observer && (
            <div className="absolute left-16 top-4 z-40 font-mono text-[12px] text-[var(--text-secondary)] sm:left-20 sm:top-7">
              ◐ {observer.placeName ?? formatLatLon(observer.latDeg, observer.lonDeg)}
            </div>
          )}

          <Sidebar layers={layers} setLayers={setLayers} data={sky} selectionId={selectionId} onSelect={select} />
          <ViewModeToggle />

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="h-6 w-6 rounded-full border border-white/40" />
            <div className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
          </div>

          <DetailPanel info={focusInfo} />

          <button
            onClick={copyShareLink}
            className="absolute bottom-8 right-4 z-40 flex h-8 items-center gap-1.5 border border-[var(--border-visible)] bg-[var(--surface)] px-3 font-mono text-[11px] text-[var(--text-secondary)] transition-colors hover:text-white sm:right-6"
            title="Copy shareable link to this sky view"
          >
            {copied ? '✓ COPIED' : '⬡ SHARE SKY'}
          </button>
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
