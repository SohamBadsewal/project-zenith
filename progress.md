# Project Zenith — Progress

## Current Status
Phase 5 in progress: 5A bloom committed; 5B LOD swap done + functionally verified. Real-GLB asset pipeline remains.

## Just Completed
- [x] 5A selective bloom — committed e373780 (stars/planets glow by brightness, B-V color kept, UI crisp)
- [x] 5B SatModel.tsx (procedural ISS + generic sat) + LOD swap in SkyPlanetarium (selected → 3D model)
- [x] Draco decoder copied to /public/draco (real-GLB drop-in ready); tsc green
- [x] Verified 5B: OverheadPanel select highlights + swaps; no console errors; orbit/drag works

## Current Blockers/Bugs
- Screenshot capture timing out late-session (GPU load; app fine per evals + clean console) — visual of model not captured, but logic verified.
- next build env hang (deploy/CI only).

## Next Immediate Task
Commit 5B; then real NASA ISS/Hubble .glb + scripts/prepare-models.mjs (needs network/Draco tooling), or other direction.
