import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

/**
 * Procedural canvas texture for a deep-sky object by type: spiral/elliptical
 * galaxy, nebula glow, or star cluster. License-free, no external assets.
 */
export function dsoTexture(type: string): THREE.Texture {
  if (cache.has(type)) return cache.get(type)!;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);

  const blob = (color: string, rMax: number, alpha = 0.6) => {
    const g = ctx.createRadialGradient(c, c, 0, c, c, rMax);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 1;
  };

  switch (type) {
    case 'spiral': {
      blob('rgba(220,225,255,0.9)', c * 0.95, 0.5);
      // faint arms
      ctx.save();
      ctx.translate(c, c);
      for (let a = 0; a < 4; a++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = 'rgba(180,200,255,0.18)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        for (let r = 6; r < c * 0.9; r += 2) {
          const ang = r * 0.05;
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'globular':
      blob('rgba(255,245,220,0.95)', c * 0.5, 0.8);
      // sprinkle stars
      for (let i = 0; i < 180; i++) {
        const r = Math.random() * c * 0.85;
        const th = Math.random() * Math.PI * 2;
        ctx.fillStyle = `rgba(255,250,235,${Math.random() * 0.7})`;
        ctx.fillRect(c + Math.cos(th) * r, c + Math.sin(th) * r, 1.5, 1.5);
      }
      break;
    case 'cluster':
      for (let i = 0; i < 90; i++) {
        const r = Math.random() * c * 0.85;
        const th = Math.random() * Math.PI * 2;
        const a = 0.4 + Math.random() * 0.6;
        const g = ctx.createRadialGradient(c + Math.cos(th) * r, c + Math.sin(th) * r, 0, c + Math.cos(th) * r, c + Math.sin(th) * r, 6);
        g.addColorStop(0, `rgba(220,230,255,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }
      break;
    case 'nebula': {
      blob('rgba(255,120,150,0.5)', c * 0.9, 0.55);
      blob('rgba(120,180,255,0.45)', c * 0.7, 0.5);
      blob('rgba(255,240,200,0.6)', c * 0.35, 0.7);
      break;
    }
    default: // irregular / elliptical
      blob('rgba(255,240,220,0.9)', c * 0.7, 0.7);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(type, tex);
  return tex;
}
