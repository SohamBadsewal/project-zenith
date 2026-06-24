// Reproducible build of bundled sky data. Run: node scripts/build-star-data.mjs
// Sources: d3-celestial (ofrohn) — stars (BSC/HR ids, mag, B-V) and IAU
// constellation line figures, both [RA(deg), Dec(deg)] J2000. Output matches
// SCHEMA.md CatalogStar + ConstellationFigure.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STARS_URL =
  'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json';
const LINES_URL =
  'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';

const MAG_LIMIT = 5.5; // keep the catalogue lean but constellations intact

// d3-celestial stores RA as longitude (-180..180); SCHEMA wants raDeg 0..360.
const ra360 = (ra) => ((ra % 360) + 360) % 360;

// Proper names for the brightest stars, keyed by HIPPARCOS id (d3-celestial's
// feature id is the HIP number). Verified against the Hipparcos catalogue.
const STAR_NAMES = {
  32349: 'Sirius', 30438: 'Canopus', 69673: 'Arcturus', 91262: 'Vega',
  24608: 'Capella', 24436: 'Rigel', 37279: 'Procyon', 27989: 'Betelgeuse',
  7588: 'Achernar', 21421: 'Aldebaran', 80763: 'Antares', 65474: 'Spica',
  37826: 'Pollux', 113368: 'Fomalhaut', 102098: 'Deneb', 49669: 'Regulus',
  97649: 'Altair', 11767: 'Polaris', 25336: 'Bellatrix', 36850: 'Castor',
  71683: 'Rigil Kentaurus', 9884: 'Hamal', 14576: 'Algol', 677: 'Alpheratz',
  15863: 'Mirfak', 5447: 'Mirach', 109268: 'Alnair', 25428: 'Alnilam',
};

const IAU_NAMES = {
  And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius', Aql: 'Aquila',
  Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes', Cae: 'Caelum',
  Cam: 'Camelopardalis', Cnc: 'Cancer', CVn: 'Canes Venatici', CMa: 'Canis Major',
  CMi: 'Canis Minor', Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia',
  Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus',
  Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis', CrB: 'Corona Borealis',
  Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux', Cyg: 'Cygnus', Del: 'Delphinus',
  Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax',
  Gem: 'Gemini', Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra',
  Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo', LMi: 'Leo Minor',
  Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus', Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa',
  Mic: 'Microscopium', Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma', Oct: 'Octans',
  Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus', Per: 'Perseus',
  Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces', PsA: 'Piscis Austrinus', Pup: 'Puppis',
  Pyx: 'Pyxis', Ret: 'Reticulum', Sge: 'Sagitta', Sgr: 'Sagittarius', Sco: 'Scorpius',
  Scl: 'Sculptor', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Tau: 'Taurus',
  Tel: 'Telescopium', Tri: 'Triangulum', TrA: 'Triangulum Australe', Tuc: 'Tucana',
  UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans',
  Vul: 'Vulpecula',
};

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function main() {
  const [stars, lines] = await Promise.all([getJson(STARS_URL), getJson(LINES_URL)]);

  const catalog = [];
  for (const f of stars.features) {
    const mag = f.properties.mag;
    if (typeof mag !== 'number' || mag > MAG_LIMIT) continue;
    const [raRaw, decDeg] = f.geometry.coordinates;
    const star = { hr: f.id, raDeg: ra360(raRaw), decDeg, mag };
    if (STAR_NAMES[f.id]) star.name = STAR_NAMES[f.id];
    const bv = parseFloat(f.properties.bv);
    if (Number.isFinite(bv)) star.bv = bv;
    catalog.push(star);
  }
  catalog.sort((a, b) => a.mag - b.mag);

  const constellations = lines.features.map((f) => {
    const id = f.id;
    // MultiLineString: array of polylines of [ra, dec]; normalise RA to 0..360.
    const paths = f.geometry.coordinates.map((line) =>
      line.map(([ra, dec]) => [ra360(ra), dec]),
    );
    return { id, name: IAU_NAMES[id] ?? id, paths };
  });

  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(join(ROOT, 'data', 'bsc5.json'), JSON.stringify(catalog));
  await writeFile(join(ROOT, 'data', 'constellations.json'), JSON.stringify(constellations));

  console.log(`stars (mag ≤ ${MAG_LIMIT}): ${catalog.length}`);
  console.log(`constellations: ${constellations.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
