import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HYG_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';
const LINES_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';
const ART_BASE = 'https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/';
const ART_INDEX = ART_BASE + 'index.json';

const MAG_LIMIT = 6.5;
const ra360 = (ra) => ((ra % 360) + 360) % 360;
const unq = (s) => (s == null ? '' : s.replace(/^"|"$/g, ''));

const GREEK = {
  Alp: 'α', Bet: 'β', Gam: 'γ', Del: 'δ', Eps: 'ε', Zet: 'ζ', Eta: 'η', The: 'θ',
  Iot: 'ι', Kap: 'κ', Lam: 'λ', Mu: 'μ', Nu: 'ν', Xi: 'ξ', Omi: 'ο', Pi: 'π',
  Rho: 'ρ', Sig: 'σ', Tau: 'τ', Ups: 'υ', Phi: 'φ', Chi: 'χ', Psi: 'ψ', Ome: 'ω',
};

const CON = {
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

const BLURB = {
  Ori: 'The Hunter — home to Betelgeuse, Rigel and the three-star Belt.',
  UMa: 'The Great Bear — contains the Big Dipper asterism and points to Polaris.',
  Cas: 'The Queen — an unmistakable W of bright stars opposite the Big Dipper.',
  Sco: 'The Scorpion — its red heart is the supergiant Antares.',
  Leo: 'The Lion — led by Regulus, riding the spring sky.',
  Tau: 'The Bull — holds the Pleiades cluster and orange Aldebaran.',
  Gem: 'The Twins — marked by the bright pair Castor and Pollux.',
  Cyg: 'The Swan — flies along the Milky Way; its tail is brilliant Deneb.',
  Lyr: 'The Lyre — anchored by Vega, one of the sky’s brightest stars.',
  Aql: 'The Eagle — its eye is Altair, a vertex of the Summer Triangle.',
  And: 'The Chained Princess — host to the great Andromeda Galaxy.',
  Peg: 'The Winged Horse — its body forms the Great Square.',
  Per: 'The Hero — contains the famous variable star Algol, the Demon Star.',
  Aqr: 'The Water Bearer — an ancient zodiac constellation of the autumn sky.',
  Psc: 'The Fishes — a faint zodiac constellation marking the spring equinox.',
  Sgr: 'The Archer — its Teapot points toward the galactic centre.',
  Cap: 'The Sea Goat — the faint, ancient zodiac sign of midwinter.',
  Vir: 'The Maiden — its brightest star is the blue-white Spica.',
  CMa: 'The Greater Dog — home to Sirius, the brightest star in the night sky.',
  Boo: 'The Herdsman — driven by golden Arcturus.',
};

async function getText(u) {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${u} -> ${r.status}`);
  return r.text();
}
async function getJson(u) {
  return JSON.parse(await getText(u));
}

function starName(proper, bayer, flam, conAbbr) {
  if (proper) return proper;
  if (bayer) {
    const letter = GREEK[bayer.replace(/[0-9]/g, '')] ?? bayer;
    const sup = bayer.match(/[0-9]+/)?.[0] ?? '';
    return `${letter}${sup} ${conAbbr}`;
  }
  if (flam) return `${flam} ${conAbbr}`;
  return '';
}

async function main() {
  const [hygText, lines, artIndex] = await Promise.all([getText(HYG_URL), getJson(LINES_URL), getJson(ART_INDEX)]);

  const rows = hygText.trim().split('\n');
  const hdr = rows[0].split(',').map(unq);
  const ix = {};
  hdr.forEach((h, i) => (ix[h] = i));

  const hipPos = new Map();
  const catalog = [];
  for (let i = 1; i < rows.length; i++) {
    const c = rows[i].split(',').map(unq);
    const hip = parseInt(c[ix.hip], 10);
    const raDeg = ra360(parseFloat(c[ix.ra]) * 15);
    const decDeg = parseFloat(c[ix.dec]);
    if (Number.isFinite(hip)) hipPos.set(hip, { raDeg, decDeg });

    const mag = parseFloat(c[ix.mag]);
    if (!(mag <= MAG_LIMIT)) continue;
    const conAbbr = c[ix.con];
    if (!conAbbr) continue;
    const name = starName(c[ix.proper], c[ix.bayer], c[ix.flam], conAbbr);
    if (!name || !Number.isFinite(hip) || hip === 0) continue;

    const star = { hr: hip, name, con: CON[conAbbr] ?? conAbbr, raDeg, decDeg, mag };
    const bv = parseFloat(c[ix.ci]);
    if (Number.isFinite(bv)) star.bv = bv;
    const distPc = parseFloat(c[ix.dist]);
    if (Number.isFinite(distPc) && distPc > 0 && distPc < 100000) star.dist = Math.round(distPc * 3.26156);
    const spect = c[ix.spect];
    if (spect) star.spect = spect;
    catalog.push(star);
  }
  catalog.sort((a, b) => a.mag - b.mag);

  const constellations = lines.features.map((f) => ({
    id: f.id,
    name: CON[f.id] ?? f.id,
    paths: f.geometry.coordinates.map((line) => line.map(([ra, dec]) => [ra360(ra), dec])),
  }));

  await mkdir(join(ROOT, 'public', 'constellation-art'), { recursive: true });
  const art = [];
  for (const con of artIndex.constellations) {
    if (!con.image) continue;
    const id = con.id.split(' ').pop();
    const anchors = con.image.anchors
      .map((a) => {
        const p = hipPos.get(a.hip);
        return p ? { px: a.pos[0], py: a.pos[1], raDeg: p.raDeg, decDeg: p.decDeg } : null;
      })
      .filter(Boolean);
    if (anchors.length < 3) continue;
    const file = con.image.file.split('/').pop();
    try {
      const img = await fetch(ART_BASE + con.image.file);
      if (!img.ok) throw new Error(`img ${img.status}`);
      await writeFile(join(ROOT, 'public', 'constellation-art', file), Buffer.from(await img.arrayBuffer()));
    } catch (e) {
      console.warn(`skip art ${id}: ${e.message}`);
      continue;
    }
    art.push({
      id,
      name: CON[id] ?? id,
      file: `/constellation-art/${file}`,
      w: con.image.size[0],
      h: con.image.size[1],
      blurb: BLURB[id] ?? `One of the 88 modern constellations.`,
      anchors,
    });
  }

  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(join(ROOT, 'data', 'bsc5.json'), JSON.stringify(catalog));
  await writeFile(join(ROOT, 'data', 'constellations.json'), JSON.stringify(constellations));
  await writeFile(join(ROOT, 'data', 'constellation-art.json'), JSON.stringify(art));

  console.log(`named stars (mag <= ${MAG_LIMIT}): ${catalog.length}`);
  console.log(`constellations: ${constellations.length}`);
  console.log(`art images: ${art.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
