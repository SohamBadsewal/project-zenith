import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const texDir = join(root, 'public', 'textures', 'planets');

const SRC = 'https://www.solarsystemscope.com/textures/download';
const TEXTURES = {
  'mars.jpg': `${SRC}/2k_mars.jpg`,
  'jupiter.jpg': `${SRC}/2k_jupiter.jpg`,
  'saturn.jpg': `${SRC}/2k_saturn.jpg`,
  'mercury.jpg': `${SRC}/2k_mercury.jpg`,
  'venus.jpg': `${SRC}/2k_venus_surface.jpg`,
  'uranus.jpg': `${SRC}/2k_uranus.jpg`,
  'neptune.jpg': `${SRC}/2k_neptune.jpg`,
  'moon.jpg': `${SRC}/2k_moon.jpg`,
};

const exists = (p) => access(p).then(() => true).catch(() => false);

async function fetchTexture(name, url) {
  const dest = join(texDir, name);
  if (await exists(dest)) return console.log(`skip ${name}`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`saved ${name}`);
  } catch (err) {
    console.warn(`miss ${name} (${err.message}) — procedural color fallback will render`);
  }
}

async function main() {
  await mkdir(texDir, { recursive: true });
  for (const [name, url] of Object.entries(TEXTURES)) await fetchTexture(name, url);
  console.log('\nGLB pipeline (ISS / Hubble) — already present in public/models, reproduce with:');
  console.log('  1. Download source from https://github.com/nasa/NASA-3D-Resources');
  console.log('  2. Import to Blender, export glTF Binary (.glb)');
  console.log('  3. npx gltf-pipeline -i model.glb -o public/models/<name>.glb -d');
}

main();
