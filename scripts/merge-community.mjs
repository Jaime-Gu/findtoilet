#!/usr/bin/env node
/**
 * FindToilet — merge community-contributed toilets (door codes etc.) into
 * per-city GeoJSON. Community sources live in data/community/*.json;
 * each feature must carry properties.city ("<country>/<city>").
 * Upserts by properties.id so re-runs stay idempotent.
 *
 * Usage: node scripts/merge-community.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const index = JSON.parse(readFileSync('data/cities.json', 'utf8'));
const dataPath = new Map();
for (const country of index.countries) {
  for (const city of country.cities) {
    dataPath.set(`${country.code}/${city.code}`, city.data);
  }
}

let merged = 0, updated = 0, added = 0;
for (const file of readdirSync('data/community')) {
  if (!file.endsWith('.json')) continue;
  const features = JSON.parse(readFileSync(`data/community/${file}`, 'utf8'));
  for (const f of features) {
    const path = dataPath.get(f.properties?.city);
    if (!path) { console.warn(`no city for ${f.properties?.id}`); continue; }
    const geo = JSON.parse(readFileSync(path, 'utf8'));
    const i = geo.features.findIndex(x => x.properties.id === f.properties.id);
    if (i >= 0) { geo.features[i] = f; updated++; }
    else { geo.features.push(f); added++; }
    writeFileSync(path, JSON.stringify(geo));
    merged++;
  }
}
console.log(`community merge done: ${merged} processed (${added} added, ${updated} updated)`);
