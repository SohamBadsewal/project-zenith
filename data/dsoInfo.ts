// data/dsoInfo.ts — rich content for deep-sky objects (galaxies, clusters, nebulae).
// Keyed by 'dso:<catalog-id>' to match the id format produced by SkyPlanetarium.

import type { ObjectInfo } from './objectInfo';

const commons = (file: string) =>
  `https://images.weserv.nl/?url=${encodeURIComponent(`https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=600`)}`;

export const DSO_INFO: Record<string, ObjectInfo> = {
  'dso:M31': {
    summary:
      'The Andromeda Galaxy is the nearest large galaxy to the Milky Way and the most distant object visible to the naked eye — 2.5 million light-years away.',
    paragraphs: [
      'Andromeda spans roughly twice the diameter of the full Moon in the sky and contains about a trillion stars. Its spiral arms host giant star-forming regions and an enormous dark-matter halo. It is currently hurtling toward us at ~110 km/s.',
      'In about 4.5 billion years Andromeda will collide and merge with the Milky Way in a slow gravitational dance, forming an elliptical "Milkomeda" galaxy. Individual stars are so far apart that stellar collisions during the merger will be extremely rare.',
    ],
    stats: [
      { label: 'Distance', value: '2.537 million ly' },
      { label: 'Diameter', value: '~220,000 ly' },
      { label: 'Stars', value: '~1 trillion' },
      { label: 'Apparent size', value: '3.2° × 1°' },
      { label: 'Apparent mag', value: '3.44' },
    ],
    facts: [
      'Andromeda is on a collision course with the Milky Way, arriving in ~4.5 billion years.',
      'It was long thought to be a "nebula" inside our own galaxy until 1923.',
      'On a dark night it is visible to the naked eye as a faint smudge.',
    ],
    image: commons('Andromeda_Galaxy_560mm_FL.jpg'),
    credit: 'Adam Evans / CC BY 2.0',
    source: { label: 'NASA — Andromeda', url: 'https://science.nasa.gov/missions/hubble/andromeda-galaxy-m31/' },
  },

  'dso:LMC': {
    summary:
      'The Large Magellanic Cloud is an irregular satellite galaxy of the Milky Way, a naked-eye showpiece of the southern sky just 160,000 light-years away.',
    paragraphs: [
      'The LMC and its smaller companion the SMC are gravitationally bound to the Milky Way and are being slowly stripped by tidal forces. They will likely be completely absorbed within a few billion years.',
      'In 1987 it hosted Supernova 1987A — the nearest supernova observed since the invention of the telescope — giving astronomers a front-row seat to a stellar explosion and confirming the production of neutrinos in a collapsing core.',
    ],
    stats: [
      { label: 'Distance', value: '160,000 ly' },
      { label: 'Diameter', value: '~14,000 ly' },
      { label: 'Apparent size', value: '~10.75° × 9.17°' },
      { label: 'Apparent mag', value: '0.9' },
    ],
    facts: [
      'Supernova 1987A — the closest supernova in 400 years — exploded inside the LMC.',
      'The LMC contains the Tarantula Nebula, the most luminous nebula known.',
      'Both Magellanic Clouds were used by southern-hemisphere navigators for centuries.',
    ],
    image: commons('Large.Magellanic.Cloud.jpg'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — LMC', url: 'https://science.nasa.gov/' },
  },

  'dso:SMC': {
    summary:
      'The Small Magellanic Cloud is a dwarf irregular galaxy and close companion to the LMC, orbiting the Milky Way at roughly 200,000 light-years.',
    paragraphs: [
      'Though smaller, the SMC is a vigorous star-forming galaxy with a higher proportion of young massive stars than the Milky Way. Its lower metallicity (fewer heavy elements) makes it a useful laboratory for studying how stars form in the early universe.',
    ],
    stats: [
      { label: 'Distance', value: '~200,000 ly' },
      { label: 'Diameter', value: '~7,000 ly' },
      { label: 'Apparent size', value: '~5.3° × 3.4°' },
      { label: 'Apparent mag', value: '2.7' },
    ],
    facts: [
      'The SMC contains about 3 billion stars.',
      'Henrietta Swan Leavitt discovered the period-luminosity relation for Cepheid variables using SMC stars in 1912 — enabling the measurement of cosmic distances.',
    ],
    image: commons('Small_Magellanic_Cloud_(Digitized_Sky_Survey_2).jpg'),
    credit: 'ESA / Digitized Sky Survey 2',
    source: { label: 'ESA — SMC', url: 'https://www.esa.int/' },
  },

  'dso:M42': {
    summary:
      'The Orion Nebula is the nearest large stellar nursery — a glowing cloud of gas and dust 1,344 light-years away where hundreds of new stars are forming right now.',
    paragraphs: [
      'At the heart of M42 lies the Trapezium, a tight cluster of four young massive stars whose ultraviolet radiation ionises the surrounding gas, making it glow. Hubble images revealed hundreds of proplyds — protoplanetary discs — around young stars embedded in the nebula.',
      'The nebula is part of the much larger Orion Molecular Cloud complex, which spans most of the constellation. It is one of the most photographed objects in the sky and visible to the naked eye as the fuzzy middle "star" of Orion\'s Sword.',
    ],
    stats: [
      { label: 'Distance', value: '1,344 ly' },
      { label: 'Size', value: '~24 ly across' },
      { label: 'Apparent size', value: '65 × 60 arcmin' },
      { label: 'Apparent mag', value: '4.0' },
      { label: 'Age', value: '~2 million years' },
    ],
    facts: [
      'Hundreds of protoplanetary discs (potential solar systems) have been found inside it.',
      'The Trapezium at its centre is one of the youngest known open clusters.',
      'It glows because four young massive stars ionise the surrounding hydrogen gas.',
    ],
    image: commons('Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg'),
    credit: 'NASA / ESA / Hubble Heritage Team',
    source: { label: 'NASA — Orion Nebula', url: 'https://science.nasa.gov/missions/hubble/orion-nebula/' },
  },

  'dso:M45': {
    summary:
      'The Pleiades — the Seven Sisters — is one of the nearest and most distinctive open clusters, a tight knot of hot blue stars wrapped in faint reflection nebulosity.',
    paragraphs: [
      'The cluster is about 444 light-years away and contains more than 1,000 confirmed member stars, though only about six or seven are visible to the naked eye. The bright stars are all hot blue B-type stars, suggesting the cluster is only about 100 million years old.',
      'The blue nebulosity around the bright stars is not the cloud they formed from — it is a separate dust cloud they are currently passing through.',
    ],
    stats: [
      { label: 'Distance', value: '444 ly' },
      { label: 'Age', value: '~100 million years' },
      { label: 'Confirmed members', value: '~1,000' },
      { label: 'Apparent size', value: '~110 arcmin' },
      { label: 'Apparent mag', value: '1.6' },
    ],
    facts: [
      'The Pleiades appear in ancient art going back 17,000 years (Lascaux cave paintings).',
      'The nebulosity is a foreground dust cloud — not the one that formed the stars.',
      'In Japanese culture they are called "Subaru" — the logo of the car brand.',
    ],
    image: commons('Pleiades_large.jpg'),
    credit: 'NASA / ESA / AURA / Caltech',
    source: { label: 'NASA — Pleiades', url: 'https://science.nasa.gov/' },
  },

  'dso:M44': {
    summary:
      'The Beehive Cluster (Praesepe) is a nearby open cluster in Cancer, one of the richest and most easily resolved clusters in the night sky.',
    paragraphs: [
      'Located ~577 light-years away, the Beehive contains about 1,000 gravitationally bound stars spread over 22 light-years. It was known in antiquity — Hipparchus catalogued it around 130 BC — and to ancient Greeks its invisibility through haze warned of coming storms.',
      'In 2012 two exoplanets were discovered orbiting Sun-like stars in the cluster, the first found in an open cluster. This suggests planet formation is common even in cluster environments.',
    ],
    stats: [
      { label: 'Distance', value: '577 ly' },
      { label: 'Age', value: '~700 million years' },
      { label: 'Members', value: '~1,000' },
      { label: 'Apparent size', value: '~95 arcmin' },
      { label: 'Apparent mag', value: '3.7' },
    ],
    facts: [
      'Two exoplanets were found orbiting stars inside the Beehive in 2012.',
      'Its classical name "Praesepe" means manger in Latin.',
      'It was invisible to Galileo — he was the first to resolve it into individual stars.',
    ],
    image: commons('Praesepe_2MASS_Atlas.jpg'),
    credit: '2MASS / NASA',
    source: { label: 'NASA — Beehive', url: 'https://science.nasa.gov/' },
  },

  'dso:M13': {
    summary:
      'The Hercules Cluster is one of the brightest globular clusters visible from the northern hemisphere — a ball of ~300,000 ancient stars packed 150 light-years across.',
    paragraphs: [
      'Globular clusters like M13 are among the oldest structures in the galaxy, with ages around 11–12 billion years. Their stars formed together in the early universe and have since evolved through a similar lifecycle — most are now cool red giants or dim white dwarfs.',
      'In 1974 the Arecibo radio telescope broadcast a message toward M13 as a symbolic gesture. At the speed of light, the reply (if any) would arrive in 25,000 years.',
    ],
    stats: [
      { label: 'Distance', value: '22,200 ly' },
      { label: 'Diameter', value: '~150 ly' },
      { label: 'Stars', value: '~300,000' },
      { label: 'Age', value: '~11.6 billion years' },
      { label: 'Apparent mag', value: '5.8' },
    ],
    facts: [
      'The 1974 Arecibo message was beamed toward M13 as humanity\'s first interstellar broadcast.',
      'Stars near its core are so dense that collisions and mergers are common.',
      'It is barely visible to the naked eye on a dark night.',
    ],
    image: commons('Messier_13_Hubble_WikiSky.jpg'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — M13', url: 'https://science.nasa.gov/' },
  },

  'dso:M57': {
    summary:
      'The Ring Nebula is the glowing shell of gas puffed off by a dying Sun-like star, its central white dwarf still visible at the geometric centre.',
    paragraphs: [
      'M57 is a planetary nebula — the term is misleading; it has nothing to do with planets. About 1 solar mass of gas has been shed by the central star over thousands of years as it ran out of nuclear fuel. The ring shape is the result of an equatorial density enhancement.',
      'The central white dwarf is about the size of Earth but packs ~0.6 solar masses; it will cool over billions of years into an inert black dwarf.',
    ],
    stats: [
      { label: 'Distance', value: '~2,000 ly' },
      { label: 'Apparent size', value: '1.4 × 1.0 arcmin' },
      { label: 'Apparent mag', value: '8.8' },
      { label: 'Central WD temp', value: '~125,000 K' },
      { label: 'Age', value: '~7,000 years' },
    ],
    facts: [
      'The central star is 200 times hotter than the Sun.',
      '"Planetary nebula" is a historical misnomer — they have nothing to do with planets.',
      'It represents the eventual fate of our own Sun in ~5 billion years.',
    ],
    image: commons('M57_The_Ring_Nebula.JPG'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — Ring Nebula', url: 'https://science.nasa.gov/' },
  },

  'dso:M81': {
    summary:
      "Bode's Galaxy is a grand-design spiral 12 million light-years away in Ursa Major — one of the brightest galaxies in the sky and a gravitational pair with the cigar-shaped M82.",
    paragraphs: [
      'M81 is a classic two-armed spiral with a prominent central bulge containing a supermassive black hole of about 70 million solar masses. Its arms are lined with HII regions where new stars are actively forming, triggered in part by its tidal interaction with M82.',
    ],
    stats: [
      { label: 'Distance', value: '12 million ly' },
      { label: 'Diameter', value: '~90,000 ly' },
      { label: 'Central black hole', value: '~70 million M☉' },
      { label: 'Apparent mag', value: '6.9' },
    ],
    facts: [
      'M81 and M82 are so close they are distorting each other gravitationally.',
      'Its black hole is among the most massive measured in nearby galaxies.',
    ],
    image: commons('Messier_81_HST.jpg'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — M81', url: 'https://science.nasa.gov/' },
  },

  'dso:M51': {
    summary:
      'The Whirlpool Galaxy is a face-on spiral caught in the gravitational embrace of its dwarf companion NGC 5195 — the first galaxy recognised as having spiral structure.',
    paragraphs: [
      'Lord Rosse sketched the spiral arms of M51 in 1845 using his 72-inch telescope — the first time spiral structure was recognised in any nebula. The companion NGC 5195 has passed through M51\'s disc twice, triggering waves of star formation in the main spiral arms.',
    ],
    stats: [
      { label: 'Distance', value: '23 million ly' },
      { label: 'Diameter', value: '~76,000 ly' },
      { label: 'Apparent mag', value: '8.4' },
      { label: 'Type', value: 'Grand-design spiral' },
    ],
    facts: [
      'M51 was the first galaxy in which spiral structure was identified (1845).',
      'The companion galaxy NGC 5195 has passed through the disc twice.',
      'Three supernovae have been observed in M51 since 1994.',
    ],
    image: commons('Messier51_sRGB.jpg'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — M51', url: 'https://science.nasa.gov/' },
  },

  'dso:M22': {
    summary:
      'The Sagittarius Cluster is one of the brightest globular clusters, hovering near the galactic centre just over 10,000 light-years away.',
    paragraphs: [
      'M22 is unusual among globular clusters in that it contains two planetary nebulae — rare evidence that some of its evolved stars have puffed off their outer layers. It is one of only four known globular clusters to contain them.',
    ],
    stats: [
      { label: 'Distance', value: '~10,600 ly' },
      { label: 'Diameter', value: '~99 ly' },
      { label: 'Apparent mag', value: '5.1' },
      { label: 'Stars', value: '~70,000' },
    ],
    facts: [
      'M22 is one of only four globular clusters known to contain planetary nebulae.',
      'It is visible to the naked eye from dark sites.',
    ],
    image: commons('Messier_22.jpg'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — M22', url: 'https://science.nasa.gov/' },
  },

  'dso:NGC869': {
    summary:
      'The Double Cluster (h & χ Persei) is a pair of young open clusters in Perseus, one of the finest binocular targets in the sky and just 7,500 light-years away.',
    paragraphs: [
      'NGC 869 and NGC 884 lie only 800 light-years apart in space and formed from the same giant molecular cloud about 12–14 million years ago. Each contains hundreds of blue supergiant stars, making them unusually luminous. Their proximity creates a dazzling paired field in any optical instrument.',
    ],
    stats: [
      { label: 'Distance', value: '~7,500 ly' },
      { label: 'Age', value: '~12–14 million years' },
      { label: 'Members', value: '~600 each' },
      { label: 'Apparent mag', value: '4.3 / 4.4' },
    ],
    facts: [
      'Both clusters are so young that many of their stars are blue supergiants yet to explode as supernovae.',
      'They have been observed since antiquity and are listed in Hipparchus\'s star catalogue.',
    ],
    image: commons('Double_Cluster_h_Chi_Persei.jpg'),
    credit: 'NASA / ESA',
    source: { label: 'NASA — Double Cluster', url: 'https://science.nasa.gov/' },
  },
};
