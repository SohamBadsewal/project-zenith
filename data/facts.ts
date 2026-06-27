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

  // ─── Bright stars ───────────────────────────────────────────────────
  // mag < 0
  'star:HR32349': 'Sirius is the brightest star in the night sky. It is a binary; its faint companion Sirius B was the first white dwarf ever discovered, in 1862.',
  'star:HR30438': 'Canopus is the second-brightest star in the sky and serves as a key navigation reference for deep-space probes — spacecraft use it to orient themselves.',
  'star:HR69673': 'Arcturus was the first star whose proper motion was detected (1718). Its orange glow comes from being a red giant ~25× the Sun\'s diameter.',
  'star:HR71683': 'Rigil Kentaurus (Alpha Centauri A) is part of the closest star system to the Sun at just 4.37 light-years — its companion Proxima Centauri hosts an Earth-sized exoplanet.',

  // mag 0–1
  'star:HR91262': 'Vega was the northern pole star ~12,000 years ago and will be again around the year 13,700 as Earth\'s axis precesses.',
  'star:HR24608': 'Capella is actually four stars in two binary pairs. Its golden glow comes from two yellow giant stars orbiting each other every 104 days.',
  'star:HR24436': 'Rigel is a blue supergiant roughly 120,000 times more luminous than the Sun, despite being ~860 light-years away.',
  'star:HR37279': 'Procyon is the eighth-brightest star and one of our nearest neighbours at 11.5 ly. Its white dwarf companion was predicted decades before it was observed.',
  'star:HR7588': 'Achernar is one of the flattest stars known — it spins so fast that its equatorial diameter is 56% larger than its polar diameter.',
  'star:HR27989': 'Betelgeuse is a red supergiant so large it would swallow Jupiter\'s orbit if placed at the Sun. It will one day explode as a supernova.',
  'star:HR68702': 'Hadar (Beta Centauri) is actually a triple star system. Its immense luminosity (about 40,000× the Sun) makes it the 11th brightest star.',
  'star:HR97649': 'Altair is one of the fastest-spinning stars visible to the naked eye, completing a rotation in about 10 hours — it bulges noticeably at its equator.',
  'star:HR60718': 'Acrux is the brightest star in the Southern Cross and appears on the flags of five countries — Australia, New Zealand, Brazil, Papua New Guinea, and Samoa.',
  'star:HR21421': 'Aldebaran, the \"eye of the bull\" in Taurus, is an orange giant 44× the Sun\'s diameter. The Pioneer 10 probe is heading in its general direction.',
  'star:HR65474': 'Spica is a binary so close the two stars distort each other into egg shapes. It helped Hipparchus discover the precession of the equinoxes in 127 BC.',
  'star:HR80763': 'Antares, the "heart of the Scorpion", is a red supergiant about 700 times the Sun\'s diameter; its name means "rival of Mars" for its reddish glow.',
  'star:HR37826': 'Pollux is the closest giant star to the Sun (34 ly) and hosts a confirmed exoplanet — Pollux b — roughly twice Jupiter\'s mass.',
  'star:HR113368': 'Fomalhaut has a dramatic debris disc nicknamed the "Eye of Sauron". It was one of the first stars to have a directly imaged exoplanet candidate.',
  'star:HR62434': 'Mimosa (Beta Crucis) is a triple star system and the second-brightest star in the Southern Cross, crucial for finding celestial south.',
  'star:HR102098': 'Deneb is one of the most luminous stars known — about 200,000× the Sun\'s luminosity. If it were as close as Sirius, it would cast shadows at night.',

  // mag 1–2
  'star:HR71681': 'Toliman (Alpha Centauri B) is a Sun-like orange dwarf just 4.37 ly away — part of the nearest star system to Earth.',
  'star:HR49669': 'Regulus spins so fast it completes a rotation in about 16 hours and is notably oblate. It lies almost exactly on the ecliptic.',
  'star:HR33579': 'Adhara was the brightest star in the sky about 4.7 million years ago when it was much closer to the Sun.',
  'star:HR36850': 'Castor is actually six stars bound together — three binary pairs orbiting each other — one of the finest multiple-star systems known.',
  'star:HR61084': 'Gacrux is the nearest red giant to the Sun and the top star of the Southern Cross. Its orange-red colour contrasts beautifully with the blue Acrux.',
  'star:HR85927': 'Shaula, at the tip of the Scorpion\'s tail, is actually a triple star system and one of the most luminous stars within 600 ly.',
  'star:HR25336': 'Bellatrix, the "Amazon Star", marks Orion\'s left shoulder and is one of the hottest stars visible to the naked eye.',
  'star:HR25428': 'Elnath marks the northern horn of Taurus and sits exactly on the Taurus–Auriga border — the only bright star shared between two constellations.',
  'star:HR45238': 'Miaplacidus is the second-brightest star in the constellation Carina and was used by Polynesian navigators for ocean voyaging.',
  'star:HR26311': 'Alnilam, the middle star of Orion\'s Belt, is roughly 275,000× the Sun\'s luminosity — one of the most luminous stars visible to the naked eye.',
  'star:HR26727': 'Alnitak, the leftmost star of Orion\'s Belt, illuminates the famous Horsehead Nebula with its intense ultraviolet radiation.',
  'star:HR62956': 'Alioth is the brightest star in Ursa Major and the 32nd-brightest in the sky — it has a peculiar spectrum with fluctuating magnetic fields.',
  'star:HR15863': 'Mirfak is the brightest star in Perseus and lies at the heart of the Alpha Persei Cluster — a young group of hot blue stars.',
  'star:HR54061': 'Dubhe, the upper-right star of the Big Dipper\'s bowl, is a pointer star that leads the eye to Polaris, the North Star.',
  'star:HR67301': 'Alkaid, at the tip of the Big Dipper\'s handle, is one of the few Dipper stars not part of the Ursa Major Moving Group.',
  'star:HR11767': 'Polaris sits almost exactly above the North Pole, so it barely moves as the sky turns — for centuries it has guided navigators north.',

  // mag 2–3 (widely known named stars)
  'star:HR9884': 'Hamal was the vernal equinox star in ancient Babylonia (~2000 BC) — the first star ancient astronomers saw after the Sun crossed the equator.',
  'star:HR86032': 'Rasalhague, the head of the Serpent-Bearer, is a fast-spinning A-type star that will become the north pole star in about 7,500 years.',
  'star:HR14576': 'Algol, the "Demon Star", was the first eclipsing binary discovered — its brightness dips every 2.87 days as a dimmer star passes in front.',
  'star:HR57632': 'Denebola, the lion\'s tail, is a young star (~400 million years old) surrounded by an infrared-excess disc that may indicate planet formation.',
  'star:HR76267': 'Alphecca is the gem of the Northern Crown (Corona Borealis) — an eclipsing binary whose brightness dips subtly every 17.4 days.',
  'star:HR65378': 'Mizar is the famous double star in the Big Dipper\'s handle — it was one of the first telescopic double stars ever resolved (1617).',
  'star:HR3179': 'Schedar marks the brightest point of the W-shaped Cassiopeia. It is an orange giant roughly 40 times the Sun\'s diameter.',
  'star:HR87833': 'Eltanin in Draco is the star James Bradley was observing in 1728 when he accidentally discovered the aberration of light — confirming Earth orbits the Sun.',
  'star:HR72607': 'Kochab was Earth\'s pole star from about 1500 BC to 500 AD, guiding ancient Phoenician and Greek navigators.',
  'star:HR84345': 'Rasalgethi is an enormous red supergiant whose diameter fluctuates — it is one of the largest stars visible to the naked eye.',
  'star:HR4427': 'Gamma Cassiopeiae (Cih) is the prototype of a class of rapidly rotating Be stars that eject matter into a hot equatorial disc.',
  'star:HR46390': 'Alphard is known as the "Solitary One" because it sits alone in a barren region of sky — the only bright star in Hydra\'s long body.',
  'star:HR100453': 'Sadr sits at the heart of Cygnus the Swan, embedded in the rich emission nebula IC 1318 — the Gamma Cygni Nebula.',
  'star:HR25930': 'Mintaka, the rightmost star of Orion\'s Belt, lies almost exactly on the celestial equator — making it a useful reference for sky navigation.',
  'star:HR82273': 'Atria, the brightest star in Triangulum Australe, is an orange giant used by southern navigators to find the south celestial pole.',
  'star:HR90185': 'Kaus Australis marks the base of the Archer\'s bow in Sagittarius — it points roughly toward the galactic centre.',
  'star:HR63125': 'Cor Caroli, "Charles\'s Heart", is the alpha star of the Hunting Dogs and is famous for its strong, complex magnetic field.',
  'star:HR95501': 'Albireo is one of the most beautiful double stars in the sky — a golden giant paired with a sapphire blue companion, stunning in any telescope.',
  'star:HR106278': 'Sadalsuud is the brightest star in Aquarius and an extremely luminous yellow supergiant — its name means "luck of lucks" in Arabic.',
  'star:HR107315': 'Enif marks the nose of Pegasus and is an orange supergiant. In 1972 it had a brief dramatic flare, brightening by nearly a magnitude.',
  'star:HR53910': 'Merak is the lower-right pointer star of the Big Dipper — draw a line through Merak and Dubhe to find Polaris.',
  'star:HR72105': 'Izar (Epsilon Boötis) is a gorgeous double star nicknamed "Pulcherrima" (most beautiful) — a gold and blue pair in small telescopes.',
};
