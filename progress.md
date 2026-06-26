# Project Zenith — Progress

## Current Status
Phase 5 COMPLETE. Real Draco GLB models (ISS + Hubble) load + render; bloom + LOD swap shipped.

## Just Completed
- [x] Wired SatModel glbUrl: ISS→/models/iss.glb, HST/Hubble→/models/hubble.glb (else procedural)
- [x] Verified real models: both valid Draco glTF; selecting ISS fetched iss.glb (200) + draco decoder wasm (200), decoded + rendered, no console errors / no fallback
- [x] tsc green throughout

## Current Blockers/Bugs
- Screenshot capture intermittently times out late-session (weak GPU under model+bloom); app verified alive + correct via network log + evals.
- next build env hang (deploy/CI only).

## Next Immediate Task
Commit Hubble wiring + GLB assets. Then optional polish (snap-camera/zoom-LOD), Phase 2B, or build hang.
