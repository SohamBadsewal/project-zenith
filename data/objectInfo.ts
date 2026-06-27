// data/objectInfo.ts — rich, sourced encyclopedia content for the detail panel.
// Keyed by the same object ids used across the app ('sun', 'moon', 'planet:mars',
// 'sat:25544', 'star:HR…'). Facts are drawn from NASA, ESA, JPL and SpaceX public
// material. Images use Wikimedia Commons' stable Special:FilePath redirect (no
// brittle hash paths); planets also carry a guaranteed local fallback texture.

export interface ObjectStat {
  label: string;
  value: string;
}

export interface ObjectInfo {
  summary: string;
  paragraphs: string[];
  stats: ObjectStat[];
  facts: string[];
  image?: string;
  fallbackImage?: string;
  credit?: string;
  source?: { label: string; url: string };
}

const commons = (file: string) =>
  `https://images.weserv.nl/?url=${encodeURIComponent(`https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=600`)}`;

export const OBJECT_INFO: Record<string, ObjectInfo> = {
  sun: {
    summary:
      'The Sun is a 4.6-billion-year-old G-type main-sequence star — a colossal sphere of hot plasma whose gravity holds the entire Solar System together.',
    paragraphs: [
      'Every second, the Sun fuses about 600 million tonnes of hydrogen into helium in its core, converting roughly 4 million tonnes of mass into pure energy. That energy takes tens of thousands of years to crawl from the core to the surface, then just over eight minutes to cross 150 million kilometres of space and reach Earth.',
      'Its visible surface, the photosphere, churns with convection cells the size of countries and is freckled with sunspots — cooler regions tangled by intense magnetic fields. Above it, the corona reaches millions of degrees and streams outward as the solar wind, driving auroras and space weather across the planets.',
    ],
    stats: [
      { label: 'Type', value: 'G2V yellow dwarf' },
      { label: 'Diameter', value: '1,391,000 km' },
      { label: 'Mass', value: '333,000 × Earth' },
      { label: 'Surface temp', value: '~5,500 °C' },
      { label: 'Core temp', value: '~15 million °C' },
      { label: 'Distance', value: '149.6M km (1 AU)' },
    ],
    facts: [
      'The Sun holds 99.86% of all the mass in the Solar System.',
      'About 1.3 million Earths could fit inside it.',
      'Light leaving the core can take 100,000+ years to reach the surface.',
      'In ~5 billion years it will swell into a red giant, then shed its layers and become a white dwarf.',
    ],
    image: commons("The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA's_Solar_Dynamics_Observatory_-_20100819.jpg"),
    credit: 'NASA / SDO',
    source: { label: 'NASA — Sun', url: 'https://science.nasa.gov/sun/' },
  },

  moon: {
    summary:
      "Earth's only natural satellite, the Moon formed ~4.5 billion years ago — likely from debris of a giant impact between the young Earth and a Mars-sized body.",
    paragraphs: [
      'The Moon is locked in synchronous rotation, so it always shows us the same face. Its surface preserves a 4-billion-year record of impacts because, with almost no atmosphere or weather, craters never erode. The dark plains we call "seas" (maria) are ancient solidified lava flows.',
      'Its gravity raises Earth\'s ocean tides and stabilises our planet\'s axial tilt, keeping the climate relatively steady. The Moon is also slowly drifting away from Earth at about 3.8 cm per year.',
    ],
    stats: [
      { label: 'Diameter', value: '3,474 km' },
      { label: 'Distance', value: '384,400 km' },
      { label: 'Gravity', value: '1.62 m/s² (1/6 g)' },
      { label: 'Day length', value: '29.5 Earth days' },
      { label: 'Age', value: '~4.5 billion yrs' },
      { label: 'Humans landed', value: '12 (1969–1972)' },
    ],
    facts: [
      'The Moon is drifting ~3.8 cm farther from Earth every year.',
      'It has moonquakes, caused by tidal stress and meteorite impacts.',
      'Apollo astronauts left retroreflectors still used to measure its distance by laser.',
      'In ~600 million years it will be too far for total solar eclipses.',
    ],
    image: commons('FullMoon2010.jpg'),
    fallbackImage: '/textures/planets/moon.jpg',
    credit: 'Gregory H. Revera',
    source: { label: 'NASA — Moon', url: 'https://science.nasa.gov/moon/' },
  },

  'planet:mercury': {
    summary:
      'Mercury is the smallest planet and the closest to the Sun — a cratered, airless world of extreme temperature swings.',
    paragraphs: [
      'With almost no atmosphere to trap heat, Mercury swings from 427 °C in daylight to −173 °C at night — the largest temperature range of any planet. Despite being nearest the Sun, permanently shadowed craters near its poles hold water ice.',
      'A single solar day on Mercury (sunrise to sunrise) lasts 176 Earth days — twice as long as its 88-day year. NASA\'s MESSENGER orbiter mapped it in detail from 2011 to 2015.',
    ],
    stats: [
      { label: 'Diameter', value: '4,879 km' },
      { label: 'Distance from Sun', value: '57.9M km' },
      { label: 'Day', value: '176 Earth days' },
      { label: 'Year', value: '88 Earth days' },
      { label: 'Temp range', value: '−173 to 427 °C' },
      { label: 'Moons', value: '0' },
    ],
    facts: [
      'A day on Mercury is longer than its year.',
      'It is the fastest planet, orbiting the Sun at ~47 km/s.',
      'Shadowed polar craters hold water ice despite the heat.',
    ],
    image: commons('Mercury_in_color_-_Prockter07-edit1.jpg'),
    fallbackImage: '/textures/planets/mercury.jpg',
    credit: 'NASA / JHU APL / MESSENGER',
    source: { label: 'NASA — Mercury', url: 'https://science.nasa.gov/mercury/' },
  },

  'planet:venus': {
    summary:
      "Venus is Earth's near-twin in size, but a runaway greenhouse effect has made it the hottest planet in the Solar System.",
    paragraphs: [
      'A thick carbon-dioxide atmosphere with sulfuric-acid clouds traps heat so effectively that the surface sits at about 465 °C — hot enough to melt lead — under crushing pressure 92 times that of Earth. Venus spins backwards and so slowly that one day-night cycle lasts 117 Earth days.',
      'Beneath the clouds lies a volcanic landscape of vast plains, highlands and tens of thousands of volcanoes. Future missions like NASA\'s DAVINCI and VERITAS aim to study its atmosphere and geology.',
    ],
    stats: [
      { label: 'Diameter', value: '12,104 km' },
      { label: 'Distance from Sun', value: '108.2M km' },
      { label: 'Day', value: '243 Earth days (retrograde)' },
      { label: 'Year', value: '225 Earth days' },
      { label: 'Surface temp', value: '~465 °C' },
      { label: 'Pressure', value: '92 × Earth' },
    ],
    facts: [
      'Venus spins backwards compared with most planets.',
      'Its surface pressure equals being ~900 m underwater on Earth.',
      'It is the brightest natural object in our night sky after the Moon.',
    ],
    image: commons('Venus-real_color.jpg'),
    fallbackImage: '/textures/planets/venus.jpg',
    credit: 'NASA / JPL',
    source: { label: 'NASA — Venus', url: 'https://science.nasa.gov/venus/' },
  },

  'planet:mars': {
    summary:
      'Mars, the Red Planet, is a cold desert world that once had rivers, lakes and possibly the conditions for life — now the most explored planet beyond Earth.',
    paragraphs: [
      'Its rusty colour comes from iron oxide dust. Mars hosts Olympus Mons, the tallest volcano in the Solar System at ~22 km, and Valles Marineris, a canyon system stretching over 4,000 km. Today its thin CO₂ atmosphere and frozen poles hide a watery past written into its rocks.',
      'A fleet of robots explores it now — NASA\'s Perseverance rover is caching samples for return to Earth, while the Ingenuity helicopter proved powered flight on another world. SpaceX is developing Starship with the long-term goal of crewed Mars missions.',
    ],
    stats: [
      { label: 'Diameter', value: '6,779 km' },
      { label: 'Distance from Sun', value: '227.9M km' },
      { label: 'Day', value: '24.6 hours' },
      { label: 'Year', value: '687 Earth days' },
      { label: 'Avg temp', value: '−63 °C' },
      { label: 'Moons', value: '2 (Phobos, Deimos)' },
    ],
    facts: [
      'Olympus Mons is nearly three times the height of Mount Everest.',
      'Mars has seasons like Earth because of its similar axial tilt.',
      'Perseverance is collecting samples for a future return mission.',
    ],
    image: commons('OSIRIS_Mars_true_color.jpg'),
    fallbackImage: '/textures/planets/mars.jpg',
    credit: 'ESA / Rosetta / OSIRIS',
    source: { label: 'NASA — Mars', url: 'https://science.nasa.gov/mars/' },
  },

  'planet:jupiter': {
    summary:
      'Jupiter is the largest planet — a gas giant so massive it could swallow all the other planets combined, with a storm wider than Earth.',
    paragraphs: [
      'Jupiter is a ball of hydrogen and helium with no solid surface, banded by powerful jet streams. Its Great Red Spot is an anticyclonic storm that has raged for centuries and is wider than our entire planet. It spins faster than any other planet, completing a day in under 10 hours.',
      'It has 95 known moons, including the four large Galilean moons. Europa hides a global ocean beneath its icy crust — a prime target in the search for life, which NASA\'s Europa Clipper will investigate.',
    ],
    stats: [
      { label: 'Diameter', value: '139,820 km' },
      { label: 'Distance from Sun', value: '778.5M km' },
      { label: 'Day', value: '9.9 hours' },
      { label: 'Year', value: '11.9 Earth years' },
      { label: 'Known moons', value: '95' },
      { label: 'Mass', value: '318 × Earth' },
    ],
    facts: [
      'The Great Red Spot has persisted for at least 350 years.',
      "Jupiter's magnetic field is the strongest of any planet.",
      "Europa likely holds more water than all of Earth's oceans.",
    ],
    image: commons('Jupiter_and_its_shrunken_Great_Red_Spot.jpg'),
    fallbackImage: '/textures/planets/jupiter.jpg',
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — Jupiter', url: 'https://science.nasa.gov/jupiter/' },
  },

  'planet:saturn': {
    summary:
      'Saturn is the jewel of the Solar System — a gas giant encircled by the most spectacular ring system ever observed.',
    paragraphs: [
      'Its rings span up to 280,000 km wide yet are often only ~10 metres thick, made of countless chunks of ice and rock. Saturn is the least dense planet — so light it would float in water, given a big enough ocean.',
      'Among its 146 known moons, Titan has a thick atmosphere and lakes of liquid methane, while Enceladus jets water vapour from a subsurface ocean through cracks at its south pole. NASA/ESA\'s Cassini mission studied the system for 13 years.',
    ],
    stats: [
      { label: 'Diameter', value: '116,460 km' },
      { label: 'Distance from Sun', value: '1.43B km' },
      { label: 'Day', value: '10.7 hours' },
      { label: 'Year', value: '29.4 Earth years' },
      { label: 'Known moons', value: '146' },
      { label: 'Ring span', value: '~280,000 km' },
    ],
    facts: [
      'Saturn is the only planet less dense than water.',
      "Enceladus erupts water into space, feeding one of Saturn's rings.",
      "Titan is the only moon with a dense atmosphere and surface liquid.",
    ],
    image: commons('Saturn_during_Equinox.jpg'),
    fallbackImage: '/textures/planets/saturn.jpg',
    credit: 'NASA / JPL / Cassini',
    source: { label: 'NASA — Saturn', url: 'https://science.nasa.gov/saturn/' },
  },

  'planet:uranus': {
    summary:
      'Uranus is an ice giant that orbits on its side, likely knocked over by a colossal ancient collision.',
    paragraphs: [
      'Tipped at 98°, Uranus essentially rolls around the Sun, giving each pole a 42-year day followed by a 42-year night. Its pale blue-green colour comes from methane in its atmosphere, which absorbs red light.',
      'It is an "ice giant" — rich in water, methane and ammonia ices around a rocky core. Only one spacecraft, Voyager 2, has ever visited, flying by in 1986.',
    ],
    stats: [
      { label: 'Diameter', value: '50,724 km' },
      { label: 'Distance from Sun', value: '2.87B km' },
      { label: 'Day', value: '17.2 hours' },
      { label: 'Year', value: '84 Earth years' },
      { label: 'Axial tilt', value: '98°' },
      { label: 'Known moons', value: '28' },
    ],
    facts: [
      'Uranus rotates on its side, unlike any other planet.',
      'It was the first planet discovered with a telescope (1781).',
      'Its moons are named after Shakespeare and Pope characters.',
    ],
    image: commons('Uranus2.jpg'),
    fallbackImage: '/textures/planets/uranus.jpg',
    credit: 'NASA / JPL / Voyager 2',
    source: { label: 'NASA — Uranus', url: 'https://science.nasa.gov/uranus/' },
  },

  'planet:neptune': {
    summary:
      'Neptune is the most distant planet — a deep-blue ice giant with the fastest winds in the Solar System.',
    paragraphs: [
      'Winds on Neptune scream at up to 2,100 km/h, faster than the speed of sound on Earth. Its vivid blue comes from methane, with an extra unknown component making it richer than Uranus. It was the first planet found by mathematical prediction rather than observation, in 1846.',
      'Neptune takes 165 Earth years to orbit the Sun once — it completed its first full orbit since discovery only in 2011. Its largest moon, Triton, orbits backwards and may be a captured dwarf planet.',
    ],
    stats: [
      { label: 'Diameter', value: '49,244 km' },
      { label: 'Distance from Sun', value: '4.5B km' },
      { label: 'Day', value: '16.1 hours' },
      { label: 'Year', value: '165 Earth years' },
      { label: 'Top winds', value: '2,100 km/h' },
      { label: 'Known moons', value: '16' },
    ],
    facts: [
      'Neptune has the fastest winds measured on any planet.',
      'It was discovered through maths before anyone saw it.',
      "Triton, its biggest moon, orbits in the 'wrong' direction.",
    ],
    image: commons('Neptune_Full.jpg'),
    fallbackImage: '/textures/planets/neptune.jpg',
    credit: 'NASA / JPL / Voyager 2',
    source: { label: 'NASA — Neptune', url: 'https://science.nasa.gov/neptune/' },
  },

  'sat:25544': {
    summary:
      'The International Space Station is the largest structure humans have ever put in space — a football-field-sized laboratory orbiting Earth since 1998.',
    paragraphs: [
      'Built by five space agencies (NASA, Roscosmos, ESA, JAXA and CSA), the ISS has been continuously crewed since November 2000 — the longest sustained human presence in space. Orbiting at about 408 km and 28,000 km/h, it laps the planet every 90 minutes, so its crew sees 16 sunrises and sunsets each day.',
      'Astronauts run thousands of microgravity experiments in biology, physics and medicine. Since 2020, SpaceX Crew Dragon capsules have carried astronauts to the station under NASA\'s Commercial Crew Program, alongside Russian Soyuz and cargo craft like SpaceX Cargo Dragon.',
    ],
    stats: [
      { label: 'NORAD ID', value: '25544' },
      { label: 'Mass', value: '~420,000 kg' },
      { label: 'Length', value: '109 m (truss)' },
      { label: 'Orbit altitude', value: '~408 km' },
      { label: 'Speed', value: '~28,000 km/h' },
      { label: 'Orbital period', value: '~90 min' },
    ],
    facts: [
      'Crews have lived aboard continuously since November 2000.',
      'The crew witnesses 16 sunrises and sunsets every day.',
      'It is often the brightest human-made object in the night sky.',
      'SpaceX Crew Dragon has flown astronauts there since 2020.',
    ],
    image: commons('International_Space_Station_after_undocking_of_STS-132.jpg'),
    credit: 'NASA',
    source: { label: 'NASA — ISS', url: 'https://www.nasa.gov/international-space-station/' },
  },

  'sat:20580': {
    summary:
      'The Hubble Space Telescope has rewritten astronomy since 1990, capturing the universe in unprecedented clarity from above the blur of the atmosphere.',
    paragraphs: [
      'Orbiting at ~535 km, Hubble\'s 2.4-metre mirror sees in ultraviolet, visible and near-infrared light. It has made more than 1.6 million observations and helped pin down the age of the universe, prove that nearly every galaxy hosts a supermassive black hole, and reveal galaxies whose light left them within a billion years of the Big Bang.',
      'Designed to be serviced, Hubble was repaired and upgraded by Space Shuttle astronauts on five missions between 1993 and 2009 — including a famous fix for a flaw in its mirror. It remains one of the most productive scientific instruments ever built.',
    ],
    stats: [
      { label: 'NORAD ID', value: '20580' },
      { label: 'Launched', value: 'April 24, 1990' },
      { label: 'Orbit altitude', value: '~535 km' },
      { label: 'Mirror', value: '2.4 m diameter' },
      { label: 'Length', value: '13.2 m' },
      { label: 'Observations', value: '1.6M+' },
    ],
    facts: [
      'Hubble can see objects more than 13 billion light-years away.',
      'Astronauts serviced it in orbit five times by Space Shuttle.',
      'Its data has appeared in over 21,000 scientific papers.',
    ],
    image: commons('HST-SM4.jpeg'),
    credit: 'NASA',
    source: { label: 'NASA — Hubble', url: 'https://science.nasa.gov/mission/hubble/' },
  },

  'star:HR32349': {
    summary:
      'Sirius, the Dog Star, is the brightest star in the night sky — a hot white star just 8.6 light-years away.',
    paragraphs: [
      'Sirius outshines every other star partly because it is intrinsically bright and partly because it is one of our nearest stellar neighbours. It is a binary: the dazzling Sirius A is orbited by Sirius B, a dense white dwarf — the burnt-out core of a once-larger star, and the first white dwarf ever discovered, in 1862.',
      'To ancient Egyptians, the dawn rising of Sirius signalled the annual flooding of the Nile, anchoring their calendar.',
    ],
    stats: [
      { label: 'Distance', value: '8.6 light-years' },
      { label: 'Apparent mag', value: '−1.46' },
      { label: 'Type', value: 'A1V white star' },
      { label: 'System', value: 'Binary (A + white dwarf)' },
    ],
    facts: [
      'Sirius is the brightest star in the night sky.',
      'Its companion, Sirius B, was the first white dwarf ever found.',
      'Its heliacal rising once marked the flooding of the Nile.',
    ],
    image: commons('Sirius_A_and_B_Hubble_photo.jpg'),
    credit: 'NASA / ESA / Hubble',
    source: { label: 'NASA — Stars', url: 'https://science.nasa.gov/universe/stars/' },
  },

  'star:HR27989': {
    summary:
      'Betelgeuse is a red supergiant in Orion — so vast that if placed where the Sun is, it would engulf the orbit of Jupiter.',
    paragraphs: [
      'Betelgeuse is nearing the end of its life and will one day explode as a supernova, briefly outshining the full Moon. In 2019–2020 it dramatically dimmed, which astronomers traced to a giant cloud of dust the star had ejected.',
      'It is a variable star whose brightness changes as its bloated surface pulses. When it does go supernova — anytime in the next ~100,000 years — it poses no danger to Earth.',
    ],
    stats: [
      { label: 'Distance', value: '~640 light-years' },
      { label: 'Apparent mag', value: '~0.5 (variable)' },
      { label: 'Type', value: 'M red supergiant' },
      { label: 'Radius', value: '~700 × Sun' },
    ],
    facts: [
      'It would swallow Jupiter\'s orbit if placed at the Sun.',
      'Its 2019 "Great Dimming" was caused by an ejected dust cloud.',
      'It will explode as a supernova — visible even in daylight.',
    ],
    image: commons('Betelgeuse_captured_by_ALMA.jpg'),
    credit: 'ALMA (ESO/NAOJ/NRAO)',
    source: { label: 'NASA — Stars', url: 'https://science.nasa.gov/universe/stars/' },
  },

  'star:HR91262': {
    summary:
      'Vega is a brilliant blue-white star 25 light-years away — one of the most studied stars after the Sun.',
    paragraphs: [
      'Vega was the northern pole star around 12,000 BC and will be again near the year 13,700 as Earth\'s axis slowly precesses. It spins so fast that it bulges at its equator. A disk of dust around it hinted at possible planet formation, inspiring decades of research.',
      'Vega served as the original reference point for the stellar brightness (magnitude) scale.',
    ],
    stats: [
      { label: 'Distance', value: '25 light-years' },
      { label: 'Apparent mag', value: '0.03' },
      { label: 'Type', value: 'A0V blue-white star' },
      { label: 'Note', value: 'Former & future pole star' },
    ],
    facts: [
      'Vega was the North Star ~14,000 years ago.',
      'It defined zero on the stellar magnitude scale.',
      'It spins so fast it is noticeably egg-shaped.',
    ],
    source: { label: 'NASA — Stars', url: 'https://science.nasa.gov/universe/stars/' },
  },

  'star:HR24436': {
    summary:
      'Rigel is a blue supergiant in Orion, one of the most luminous stars visible to the naked eye.',
    paragraphs: [
      'Despite lying about 860 light-years away, Rigel shines as Orion\'s brightest star because it radiates roughly 120,000 times the Sun\'s light. It is a young, massive star burning through its fuel at a furious rate and is also destined to end as a supernova.',
    ],
    stats: [
      { label: 'Distance', value: '~860 light-years' },
      { label: 'Apparent mag', value: '0.13' },
      { label: 'Type', value: 'B8 blue supergiant' },
      { label: 'Luminosity', value: '~120,000 × Sun' },
    ],
    facts: [
      'Rigel is ~120,000 times more luminous than the Sun.',
      'It is the brightest star in the constellation Orion.',
      'It is a multiple-star system, not a single star.',
    ],
    source: { label: 'NASA — Stars', url: 'https://science.nasa.gov/universe/stars/' },
  },

  'star:HR11767': {
    summary:
      'Polaris, the North Star, sits almost directly above Earth\'s North Pole, making it a steadfast guide for navigators.',
    paragraphs: [
      'Because it lies nearly on the line of Earth\'s rotation axis, Polaris barely moves as the night sky wheels around it. It is actually a triple-star system led by a yellow supergiant that is also a Cepheid variable — the class of pulsating stars used to measure cosmic distances.',
      'Earth\'s axis precesses over ~26,000 years, so Polaris has not always been — and will not always be — the pole star.',
    ],
    stats: [
      { label: 'Distance', value: '~433 light-years' },
      { label: 'Apparent mag', value: '1.98' },
      { label: 'Type', value: 'F7 supergiant (Cepheid)' },
      { label: 'System', value: 'Triple star' },
    ],
    facts: [
      'Polaris marks true north to within about 0.7°.',
      'It is a pulsating Cepheid variable star.',
      'In 12,000 years, Vega will be the pole star instead.',
    ],
    source: { label: 'NASA — Stars', url: 'https://science.nasa.gov/universe/stars/' },
  },

  'star:HR80763': {
    summary:
      'Antares is a colossal red supergiant — the "heart of the Scorpion" and a rival to Mars in its ruddy glow.',
    paragraphs: [
      'Antares is about 700 times the diameter of the Sun; placed at the centre of our Solar System, its surface would extend past the orbit of Mars. Its name means "rival of Ares (Mars)" because its reddish colour resembles the planet.',
      'Like other red supergiants, Antares is nearing the end of its life and will eventually explode as a supernova.',
    ],
    stats: [
      { label: 'Distance', value: '~550 light-years' },
      { label: 'Apparent mag', value: '~1.0 (variable)' },
      { label: 'Type', value: 'M red supergiant' },
      { label: 'Radius', value: '~700 × Sun' },
    ],
    facts: [
      'Its name means "rival of Mars" for its red colour.',
      'It is one of the largest stars visible to the naked eye.',
      'It will end its life as a supernova.',
    ],
    source: { label: 'NASA — Stars', url: 'https://science.nasa.gov/universe/stars/' },
  },
};

import { DSO_INFO } from './dsoInfo';

const GENERIC: ObjectInfo = {
  summary:
    'A point of light in the night sky. Settle the reticle on the Sun, Moon, a planet, the ISS, Hubble or a bright named star for a detailed dossier.',
  paragraphs: [
    'Most visible stars are distant suns, many far larger and brighter than our own, their light often setting out centuries before reaching your eye.',
  ],
  stats: [],
  facts: [],
  source: { label: 'NASA Science', url: 'https://science.nasa.gov/' },
};

/** Rich content for an object id, with a graceful generic fallback for stars
 *  and constellations that don't have a bespoke entry yet. */
export function lookupInfo(id: string | undefined): ObjectInfo | undefined {
  if (!id) return undefined;
  if (OBJECT_INFO[id]) return OBJECT_INFO[id];
  if (id.startsWith('dso:')) return DSO_INFO[id] ?? GENERIC;
  if (id.startsWith('star:') || id.startsWith('con:')) return GENERIC;
  return undefined;
}
