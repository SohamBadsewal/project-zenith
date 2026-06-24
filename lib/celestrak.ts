// celestrak.ts — parse CelesTrak GP `FORMAT=TLE` text (3-line sets) into
// SatelliteTLE records. Server-side only (used by the proxy route).

import type { SatelliteTLE } from '@/types';
import { parseTle } from './satellites';

export function parseTleText(
  text: string,
  group: SatelliteTLE['group'],
): SatelliteTLE[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
  const out: SatelliteTLE[] = [];
  for (let i = 0; i + 2 < lines.length + 1; i += 3) {
    const name = (lines[i] ?? '').trim();
    const l1 = lines[i + 1];
    const l2 = lines[i + 2];
    if (l1?.startsWith('1 ') && l2?.startsWith('2 ')) {
      try {
        out.push(parseTle(name || `NORAD ${l1.slice(2, 7).trim()}`, l1, l2, group));
      } catch {
        // skip malformed element set
      }
    }
  }
  return out;
}

export const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';
