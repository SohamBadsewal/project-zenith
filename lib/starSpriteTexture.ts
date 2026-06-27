import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/**
 * Procedural soft-round star sprite: bright white core + Gaussian-ish halo
 * falloff to transparent. The instanced star texture. Cached. Client-only.
 */
export function starSpriteTexture(): THREE.Texture {
  if (cached) return cached;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const halo = ctx.createRadialGradient(half, half, 0, half, half, half);
  halo.addColorStop(0, 'rgba(255,255,255,1)');
  halo.addColorStop(0.16, 'rgba(255,255,255,0.9)');
  halo.addColorStop(0.32, 'rgba(255,255,255,0.25)');
  halo.addColorStop(0.55, 'rgba(255,255,255,0.04)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cached = tex;
  return tex;
}
