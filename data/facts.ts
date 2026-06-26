// data/facts.ts — curated interesting facts keyed by object id.
// Star ids are `star:HR<hr>` (see lib/ephemeris.ts; hr is the HIP id from
// data/bsc5.json). Missing keys fall back to the panel's generic blurb.

export const FACTS: Record<string, string> = {
  // Sun & Moon
  sun: 'The Sun accounts for 99.86% of all the mass in the Solar System — you could fit 1.3 million Earths inside it.',
  moon: 'The Moon is slowly drifting away from Earth at about 3.8 cm per year; in ~600 million years total solar eclipses will be impossible.',

  // Planets
  'planet:mercury': 'Mercury\'s day (176 Earth days) is longer than its year (88 Earth days) — and despite being closest to the Sun, it is not the hottest planet.',
  'planet:venus': 'Venus spins backwards and so slowly that a single day-night cycle lasts 117 Earth days. Its surface is hot enough to melt lead.',
  'planet:mars': 'Mars hosts Olympus Mons, the tallest volcano in the Solar System — nearly three times the height of Everest.',
  'planet:jupiter': 'Jupiter\'s Great Red Spot is a storm wider than Earth that has been raging for at least 350 years.',
  'planet:saturn': 'Saturn is so low-density that it would float in water — if you could find a bathtub big enough.',
  'planet:uranus': 'Uranus rotates on its side, tipped 98°, likely after a colossal ancient collision.',
  'planet:neptune': 'Neptune has the fastest winds in the Solar System, reaching 2,100 km/h — supersonic on Earth.',

  // Satellites
  'sat:25544': 'The ISS orbits Earth at ~28,000 km/h, circling the planet every 90 minutes — its crew sees 16 sunrises a day.',
  'sat:20580': 'The Hubble Space Telescope has made over 1.5 million observations since 1990; its images reach back to within 500 million years of the Big Bang.',

  // Bright stars (ids verified against data/bsc5.json)
  'star:HR32349': 'Sirius is the brightest star in the night sky. It is a binary; its faint companion Sirius B was the first white dwarf ever discovered, in 1862.',
  'star:HR91262': 'Vega was the northern pole star ~12,000 years ago and will be again around the year 13,700 as Earth\'s axis precesses.',
  'star:HR27989': 'Betelgeuse is a red supergiant so large it would swallow Jupiter\'s orbit if placed at the Sun. It will one day explode as a supernova.',
  'star:HR24436': 'Rigel is a blue supergiant roughly 120,000 times more luminous than the Sun, despite being ~860 light-years away.',
  'star:HR11767': 'Polaris sits almost exactly above the North Pole, so it barely moves as the sky turns — for centuries it has guided navigators north.',
  'star:HR80763': 'Antares, the "heart of the Scorpion", is a red supergiant about 700 times the Sun\'s diameter; its name means "rival of Mars" for its reddish glow.',
};
