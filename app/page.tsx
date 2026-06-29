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
import { HeroScene } from '@/components/hero/HeroScene';
import { HeroHud } from '@/components/hero/HeroHud';
import { audio } from '@/components/hero/audio';
import { SkyPlanetarium, type Layers, type FocusInfo } from '@/components/scene/SkyPlanetarium';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { TransitionRig } from '@/components/scene/TransitionRig';
import { StaticCamera } from '@/components/scene/StaticCamera';
import { Hud } from '@/components/ui/Hud';
import { LocationCard } from '@/components/ui/LocationCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Sidebar } from '@/components/ui/Sidebar';
import { ViewModeToggle } from '@/components/ui/ViewModeToggle';
import { GuideCard } from '@/components/ui/GuideCard';
import { SkyGuideCard } from '@/components/ui/SkyGuideCard';
import { BackgroundMusic } from '@/components/ui/BackgroundMusic';
import { SkySearch } from '@/components/ui/SkySearch';
import { CompareToggle } from '@/components/ui/CompareToggle';
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
  const launch = useZenith((s) => s.launch);
  const observer = useZenith((s) => s.observer);
  const compareObserver = useZenith((s) => s.compareObserver);
  const mode = useZenith((s) => s.mode);
  const pending = useZenith((s) => s.pending);
  const selectionId = useZenith((s) => s.selectionId);
  const select = useZenith((s) => s.select);
  const setPhase = useZenith((s) => s.setPhase);
  const viewMode = useZenith((s) => s.viewMode);
  const time = useZenith((s) => s.time);
  const globeIntro = useZenith((s) => s.globeIntro);
  const status = useZenith((s) => s.status);

  const [mounted, setMounted] = useState(false);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [focusInfo, setFocusInfo] = useState<FocusInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [skyReady, setSkyReady] = useState(false);
  const sky = useSky();
  const hashWritten = useRef(false);
  const tRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

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
    if (launch === 'magnifying' && useZenith.getState().skipAnimation) {
      useZenith.getState().fireLaunch();
    }
  }, [launch]);

  useEffect(() => {
    if (launch !== 'launched') return;
    const skip = useZenith.getState().skipAnimation;
    if (skip) {
      useZenith.getState().enterWarp();
    } else {
      // Let the shuttle fly nearly its full ascent before we leave the launch scene.
      const t = setTimeout(() => useZenith.getState().enterWarp(), 4800);
      return () => clearTimeout(t);
    }
  }, [launch]);

  useEffect(() => {
    if (phase !== 'warp') return;
    audio.fadeRoar(1.4);
    // Cinematic dark dissolve — the rocket climbs into a deepening sky (no white flash).
    if (overlayRef.current) overlayRef.current.style.opacity = '1';
    const t = setTimeout(() => {
      audio.spaceHum();
      useZenith.getState().enterGlobe();
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'globe') return;
    // Fade the darkness away as the camera descends out of space toward Earth.
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
    // Fade out the space hum since the rocket transition is complete!
    audio.fadeHum(2.0);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'descent') return;
    tRef.current = 0;
    const proxy = { t: 0 };
    const tween = gsap.to(proxy, {
      t: 1,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        tRef.current = proxy.t;
      },
    });
    if (overlayRef.current) overlayRef.current.style.opacity = '1';
    const done = setTimeout(() => setPhase('sky'), 2000);
    return () => {
      tween.kill();
      clearTimeout(done);
    };
  }, [phase, setPhase]);

  useEffect(() => {
    if (phase !== 'sky') {
      setSkyReady(false);
      return;
    }
    const t = setTimeout(() => {
      setSkyReady(true);
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'sky') return;
    const isLoading = !skyReady || status === 'loading' || status === 'idle';
    if (isLoading) {
      if (overlayRef.current) overlayRef.current.style.opacity = '1';
    } else {
      if (overlayRef.current) overlayRef.current.style.opacity = '0';
    }
  }, [phase, status, skyReady]);

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

  const showHero = phase === 'launch' || phase === 'warp';
  const showGlobe = phase === 'globe' || phase === 'descent';
  const showSky = phase === 'sky';

  const goBack = () => {
    window.location.hash = '';
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
    setFocusInfo(null);
    useZenith.setState({
      phase: 'globe',
      globeIntro: false,
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
        phase === 'sky' && mode === 'compare' ? (
          <div className="flex h-screen w-screen bg-black divide-x divide-zinc-800 pointer-events-auto">
            {/* Left Column: Location A */}
            <div className="relative flex-1 h-full overflow-hidden">
              <Canvas shadows={!isMobile} dpr={[1, 2]} gl={{ powerPreference: 'high-performance', antialias: !isMobile }} camera={{ position: [0, 0, 0], fov: 45, near: 0.1, far: 1000 }}>
                <SkyPlanetarium observerOverride={observer} data={sky} layers={layers} selectionId={selectionId} onSelect={select} onFocus={setFocusInfo} />
                {viewMode === 'static' && <StaticCamera />}
                {(viewMode === 'freeroam' || viewMode === 'freeview') && (
                  <OrbitControls makeDefault enablePan={false} enableZoom rotateSpeed={-0.4} minDistance={0.1} maxDistance={2} enableDamping dampingFactor={0.12} />
                )}
              </Canvas>
              {viewMode !== 'freeview' && observer && (
                <div className="absolute left-4 top-16 z-30 pointer-events-none bg-black/60 border border-white/10 px-4 py-2 font-doto text-[11px] uppercase tracking-[0.16em] text-white" style={{ borderRadius: 6 }}>
                  LOCATION A: {observer.placeName ?? formatLatLon(observer.latDeg, observer.lonDeg)}
                </div>
              )}
            </div>
            {/* Right Column: Location B */}
            <div className="relative flex-1 h-full overflow-hidden">
              <Canvas shadows={!isMobile} dpr={[1, 2]} gl={{ powerPreference: 'high-performance', antialias: !isMobile }} camera={{ position: [0, 0, 0], fov: 45, near: 0.1, far: 1000 }}>
                <SkyPlanetarium observerOverride={compareObserver} data={sky} layers={layers} selectionId={selectionId} onSelect={select} onFocus={setFocusInfo} />
                {viewMode === 'static' && <StaticCamera />}
                {(viewMode === 'freeroam' || viewMode === 'freeview') && (
                  <OrbitControls makeDefault enablePan={false} enableZoom rotateSpeed={-0.4} minDistance={0.1} maxDistance={2} enableDamping dampingFactor={0.12} />
                )}
              </Canvas>
              {viewMode !== 'freeview' && compareObserver && (
                <div className="absolute left-4 top-16 z-30 pointer-events-none bg-black/60 border border-white/10 px-4 py-2 font-doto text-[11px] uppercase tracking-[0.16em] text-white" style={{ borderRadius: 6 }}>
                  LOCATION B: {compareObserver.placeName ?? formatLatLon(compareObserver.latDeg, compareObserver.lonDeg)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Canvas shadows={!isMobile} dpr={[1, 2]} gl={{ powerPreference: 'high-performance', antialias: !isMobile }} camera={{ position: [0, 4.5, 22], fov: 45, near: 0.1, far: 1000 }}>
            {showHero && <HeroScene />}

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
              <SkyPlanetarium data={sky} layers={layers} selectionId={selectionId} onSelect={select} onFocus={setFocusInfo} />
            )}

            {showHero && !isMobile && (
              <EffectComposer>
                <Bloom luminanceThreshold={0.55} luminanceSmoothing={0.18} intensity={2.0} radius={0.85} mipmapBlur />
              </EffectComposer>
            )}
            {showSky && !isMobile && (
              <EffectComposer>
                <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.6} intensity={0.5} radius={0.4} mipmapBlur />
              </EffectComposer>
            )}

            <TransitionRig phase={phase} tRef={tRef} />

            {phase === 'globe' && !globeIntro && (
              <OrbitControls makeDefault enablePan={false} minDistance={1.4} maxDistance={5} enableDamping />
            )}
            {phase === 'sky' && viewMode === 'static' && <StaticCamera />}
            {phase === 'sky' && (viewMode === 'freeroam' || viewMode === 'freeview') && (
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
        )
      )}

      <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-40 bg-black opacity-0 transition-opacity duration-1000 ease-in-out" />

      {showHero && <HeroHud />}

      {phase === 'globe' && (
        <>
          <Hud />
          <CompareToggle />
          <SearchBar />
          <LocationCard />
          {!pending && <GuideCard />}
        </>
      )}

      {phase === 'sky' && (
        <>
          {viewMode !== 'freeview' && (
            <>
              <button
                onClick={goBack}
                className="absolute right-4 top-4 z-40 flex h-10 px-4 items-center justify-center gap-1.5 border border-[var(--border-visible)] bg-[var(--surface)] font-doto text-[13px] font-bold tracking-[0.16em] text-white hover:text-[var(--interactive)] transition-all sm:right-6 sm:top-6"
                style={{ borderRadius: 6 }}
                aria-label="Back to globe"
              >
                <span className="text-[16px] leading-none">‹</span>
                <span>BACK</span>
              </button>
              
              <SkySearch data={sky} layers={layers} setLayers={setLayers} onSelect={select} />

              {mode === 'single' && observer && (
                <div className="absolute left-16 top-4 z-40 font-mono text-[12px] text-[var(--text-secondary)] sm:left-20 sm:top-7">
                  ◐ {observer.placeName ?? formatLatLon(observer.latDeg, observer.lonDeg)}
                </div>
              )}

              <Sidebar layers={layers} setLayers={setLayers} data={sky} selectionId={selectionId} onSelect={select} open={sidebarOpen} setOpen={setSidebarOpen} />
              <SkyGuideCard />

              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="h-6 w-6 rounded-full border border-white/40" />
                <div className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
              </div>

              <button
                onClick={copyShareLink}
                className="absolute bottom-8 right-4 z-40 flex h-8 items-center gap-1.5 border border-[var(--border-visible)] bg-[var(--surface)] px-3 font-mono text-[11px] text-[var(--text-secondary)] transition-colors hover:text-white sm:right-6"
                title="Copy shareable link to this sky view"
              >
                {copied ? '✓ COPIED' : '⬡ SHARE SKY'}
              </button>
            </>
          )}

          <DetailPanel key={focusInfo?.id ?? 'none'} info={focusInfo} sidebarOpen={sidebarOpen} />
          <ViewModeToggle />

          {(!skyReady || status === 'loading' || status === 'idle') && (
            <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-800 border-t-[var(--interactive)]" style={{ pointerEvents: 'auto' }} />
              <div className="mt-4 font-doto text-[11px] uppercase tracking-[0.24em] text-white/50 animate-pulse select-none" style={{ pointerEvents: 'auto' }}>
                Loading sky view...
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'warp' && (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-800 border-t-[var(--interactive)]" style={{ pointerEvents: 'auto' }} />
          <div className="mt-4 font-doto text-[11px] uppercase tracking-[0.24em] text-white/50 animate-pulse select-none" style={{ pointerEvents: 'auto' }}>
            Entering Earth orbit...
          </div>
        </div>
      )}

      {phase === 'descent' && (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-800 border-t-[var(--interactive)]" style={{ pointerEvents: 'auto' }} />
          <div className="mt-4 font-doto text-[11px] uppercase tracking-[0.24em] text-white/50 animate-pulse select-none" style={{ pointerEvents: 'auto' }}>
            Calibrating local coordinates...
          </div>
        </div>
      )}

      {mounted && <BackgroundMusic />}
    </main>
  );
}
