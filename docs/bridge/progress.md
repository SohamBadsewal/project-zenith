# Progress — Phase 0: The Bridge (Rocket → ProjectZenith)

## 1. Current Status
Bridge COMPLETE & verified. Single-canvas rocket-launch intro flows into the existing Earth picker: `launch → warp → globe → descent → sky`. Built (`next build --webpack`), live-tested end to end, no console errors.

## 2. Just Completed
- [x] **Step 1 — Global State Refactor:** `useZenith` launch sub-machine (`idle→magnifying→armed→dragging→launched`) + `releaseDrag`.
- [x] **Step 2 — Port rocket scene** → `components/hero/{Shuttle,CameraRig,SmokeSystem,EnvironmentRig,LaunchPad,HeroScene}.tsx` + `smoke.ts` shader; reads `useZenith.launch`; GLB+draco already in `public/`. `audio.js` (+`audio.d.ts`) reused.
- [x] **Step 3 — Hero UI:** removed `LandingHero`; new `HeroHud.tsx` in Tailwind/Nothing system (drag-to-thrust gesture + accessible "Tap to ignite" fallback + reduced-motion path). Magnify cinematic plays UI-free.
- [x] **Step 4 — Transition (warp bridge):** on `launched`, 2.2s → `enterWarp()`; white `warpFlash` overlay (z-50) + 0.7s → `enterGlobe()`. HeroScene unmounts → GLB GPU release.
- [x] **Step 5 — Preload:** Globe mounts during `warp` (behind the flash) so `globe` reveals ready.
- [x] **Step 6 — Single-canvas wiring:** `page.tsx` renders `<HeroScene>` for `launch|warp`, Globe for `warp|globe|descent`, sky for `sky`; phase-gated EffectComposer/Bloom (hero vs sky); `TransitionRig` guarded to skip `launch|warp` (HeroScene's `CameraRig` owns the camera there).
- [x] **Step 7 — Audio crossfade:** `audio.fadeRoar()` on warp → `audio.spaceHum()` on globe.

## 3. Current Blockers / Bugs
- None functional. tsc clean · build OK · live flow verified (Challenger.glb 200, earth_day.jpg 200, no errors).

## 4. Next / Optional polish
- Step 8 — unify the Sun directionalLight across rocket + globe terminator (currently each phase lights itself).
- Idle 3D rocket preview (currently the shuttle is hidden until magnify; intro shows starfield + copy).
- Frustum-based warp trigger instead of the 2.2s timer (cosmetic).
