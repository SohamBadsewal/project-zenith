import * as THREE from 'three';

let cachedSurface: THREE.Texture | null = null;
let cachedGlow: THREE.Texture | null = null;

// --- tiny value-noise fbm (seeded, deterministic) ----------------------------
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const tl = hash(xi, yi);
  const tr = hash(xi + 1, yi);
  const bl = hash(xi, yi + 1);
  const br = hash(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(tl, tr, u), THREE.MathUtils.lerp(bl, br, u), v);
}
function fbm(x: number, y: number, octaves: number): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

// Color ramp from cool sunspot to bright photosphere.
function ramp(t: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [60, 10, 0]],
    [0.35, [150, 35, 0]],
    [0.55, [232, 92, 12]],
    [0.72, [255, 150, 40]],
    [0.86, [255, 205, 110]],
    [1.0, [255, 244, 214]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0 || 1);
      return [
        c0[0] + (c1[0] - c0[0]) * k,
        c0[1] + (c1[1] - c0[1]) * k,
        c0[2] + (c1[2] - c0[2]) * k,
      ];
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * Procedural solar photosphere: layered fbm granulation with a few darker
 * sunspots, as an equirectangular CanvasTexture. Cached singleton, client-only.
 * Reads beautifully as an emissive map under the scene's bloom pass.
 */
export function sunSurfaceTexture(): THREE.Texture {
  if (cachedSurface) return cachedSurface;
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const data = img.data;

  // A handful of sunspot centres (in 0..1 uv).
  const spots = Array.from({ length: 5 }, () => ({
    u: Math.random(),
    v: 0.18 + Math.random() * 0.64,
    r: 0.025 + Math.random() * 0.05,
  }));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      // Coarse convection cells + fine granulation.
      const coarse = fbm(u * 9, v * 9, 4);
      const fine = fbm(u * 38 + 50, v * 38 + 50, 3);
      let t = coarse * 0.6 + fine * 0.55;
      // Bright filament veins.
      t += Math.pow(fbm(u * 18 + 12, v * 18 + 7, 3), 3) * 0.35;
      // Sunspots: darken near spot centres.
      for (const s of spots) {
        const du = Math.min(Math.abs(u - s.u), 1 - Math.abs(u - s.u));
        const dv = v - s.v;
        const d = Math.sqrt(du * du + dv * dv);
        if (d < s.r) t *= 0.25 + 0.75 * (d / s.r);
      }
      t = THREE.MathUtils.clamp(t, 0, 1);
      const [r, g, b] = ramp(t);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cachedSurface = tex;
  return tex;
}

/** Soft radial corona sprite (bright core → transparent edge) for the sun glow. */
export function sunGlowTexture(): THREE.Texture {
  if (cachedGlow) return cachedGlow;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, 'rgba(255,240,200,0.95)');
  g.addColorStop(0.25, 'rgba(255,180,80,0.55)');
  g.addColorStop(0.55, 'rgba(255,120,40,0.22)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedGlow = tex;
  return tex;
}
