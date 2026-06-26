# Project Zenith — Progress

## Current Status
Phase 5 substantially complete: 5A bloom + 5B LOD swap shipped; SatModel now GLB-ready (drop-in iss.glb auto-loads).

## Just Completed
- [x] SatModel: useGLTF('/models/iss.glb','/draco/') + bbox-normalize + ErrorBoundary→procedural fallback
- [x] /public/models created (drop-in location); /public/draco decoder staged
- [x] tsc green; verified app: sat select/deselect works, no console errors (procedural fallback active)

## Current Blockers/Bugs
- Awaiting a license-vetted ISS .glb from user → /public/models/iss.glb (then real model auto-loads).
- next build env hang (deploy/CI only).

## Next Immediate Task
Commit GLB-ready SatModel. Then: real asset wiring on drop-in, or other direction (Phase 2B, build hang, snap-camera/zoom-LOD).
