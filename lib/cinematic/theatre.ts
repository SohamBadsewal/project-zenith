'use client';

// Theatre.js cinematic-reveal setup. We use @theatre/core only — @theatre/r3f
// is pinned to React-Three-Fiber v8 and is incompatible with this project's
// R3F v9 / React 19, so the camera is driven manually from a single animated
// `progress` scalar (see CinematicCamera). The baked sequence keyframes live in
// revealState.json so the reveal plays in production without the studio editor.

import { getProject, types } from '@theatre/core';
import revealState from './revealState.json';

// revealState is a studio-shaped save file; Theatre validates it at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const project = getProject('Zenith Reveal', { state: revealState as any });

/** The reveal timeline. */
export const revealSheet = project.sheet('Reveal');

/** Single 0→1 scalar the sequence animates; mapped to the camera fly-in. */
export const revealObj = revealSheet.object('Camera', {
  progress: types.number(0, { range: [0, 1] }),
});

/** Resolves once the project state is loaded and the sequence is playable. */
export const revealReady = project.ready;

/**
 * Subscribe to the animated `progress` scalar. Returns an unsubscribe fn.
 * Using onValuesChange (rather than val() in a render loop) keeps the Theatre
 * prism "hot", avoiding the per-frame "cold prism" warning.
 */
export function subscribeProgress(cb: (progress: number) => void): () => void {
  return revealObj.onValuesChange((v) => cb(v.progress));
}

let studioStarted = false;
/** Dev-only: mount the Theatre studio editor for hand-tuning the reveal. */
export function startStudio() {
  if (studioStarted || process.env.NODE_ENV !== 'development') return;
  studioStarted = true;
  void import('@theatre/studio')
    .then((m) => m.default.initialize())
    .catch(() => {
      /* studio is optional; ignore if it fails to load */
    });
}
