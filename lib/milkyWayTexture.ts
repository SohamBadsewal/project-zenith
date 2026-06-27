import * as THREE from 'three';

let cached: THREE.Texture | null = null;

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
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(xi, yi), hash(xi + 1, yi), u),
    THREE.MathUtils.lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u),
    v,
  );
}
function fbm(x: number, y: number, octaves: number): number {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

/**
 * Procedural Milky Way texture in galactic equirectangular coordinates.
 * U = 0..1 → galactic longitude 0..360°, V = 0..1 → lat +90°..−90°.
 * Cached singleton; client-only (uses canvas).
 */
export function milkyWayTexture(): THREE.Texture {
  if (cached) return cached;
  const W = 1024, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const DR = Math.PI / 180;

  for (let py = 0; py < H; py++) {
    const b = (0.5 - py / H) * 180; // galactic latitude deg, +90 top
    for (let px = 0; px < W; px++) {
      const l = (px / W) * 360; // galactic longitude deg
      const lr = l * DR;

      // Angular distance from galactic center (lon=0°)
      const dl = Math.min(l, 360 - l);
      // Band Gaussian: wider near the galactic center
      const sigma = 12 + 6 * Math.exp(-(dl * dl) / (2 * 50 * 50));
      const band = Math.exp(-(b * b) / (2 * sigma * sigma));

      // Seamless circular noise coords (avoid seam at U=0/1)
      const cx = Math.cos(lr), cy = Math.sin(lr);
      const coarse = fbm(cx * 4.5 + 3.7, cy * 4.5 + b * 0.15 + 1.3, 4);
      const fine   = fbm(cx * 14 + 7.1,  cy * 14  + b * 0.55 + 4.2, 3);

      // Galactic-centre bulge
      const bulge = Math.exp(-(dl * dl + b * b) / (2 * 22 * 22)) * 0.7;

      // Subtract fine noise to create dark dust lanes
      let t = band * (0.28 + coarse * 0.55 - fine * 0.25) + bulge;
      t = THREE.MathUtils.clamp(t, 0, 1);
      const br = t * 255;

      const i = (py * W + px) * 4;
      d[i]     = Math.round(br * 0.46); // R: warm dust reddish-brown
      d[i + 1] = Math.round(br * 0.32); // G: amber-orange
      d[i + 2] = Math.round(br * 0.20); // B: dark gold-brown
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cached = tex;
  return tex;
}
