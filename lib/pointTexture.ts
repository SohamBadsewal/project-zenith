import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/**
 * Soft round sprite for point stars. The default `pointsMaterial` draws square
 * GL points; mapping this radial-gradient texture (white centre → transparent
 * edge) makes each star a round, softly-falling-off dot instead. Cached as a
 * singleton — every starfield shares one GPU texture. Client-only (uses canvas).
 */
export function circlePointTexture(): THREE.Texture {
  if (cached) return cached;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cached = tex;
  return tex;
}
