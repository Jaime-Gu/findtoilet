#!/usr/bin/env node
/**
 * FindToilet — fetch public toilets for a city from OpenStreetMap via Overpass API.
 * Usage: node scripts/fetch-osm-toilets.mjs <relationId> <outputPath>
 * Example: node scripts/fetch-osm-toilets.mjs 71525 data/toilets/france/paris.geojson
 *
 * Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright
 */

const [relationId, outputPath] = process.argv.slice(2);
if (!relationId || !outputPath) {
  console.error('Usage: node fetch-osm-toilets.mjs <relationId> <outputPath>');
  process.exit(1);
}

const areaId = 3600000000 + Number(relationId);
const query = `
[out:json][timeout:60];
area(${areaId})->.searchArea;
(
  node["amenity"="toilets"](area.searchArea);
  way["amenity"="toilets"](area.searchArea);
);
out center tags;
`;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);

async function fetchOverpass() {
  // Note: node fetch gets blocked (HTTP 406) by overpass-api.de regardless of
  // User-Agent, so we shell out to curl which passes their filtering.
  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying ${endpoint} ...`);
      const { stdout } = await execFileP('curl', [
        '-sS', '-X', 'POST', endpoint,
        '--data-urlencode', `data=${query}`,
        '-H', 'User-Agent: FindToilet/0.1 (open-source toilet map)',
        '--max-time', '90',
      ], { maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(stdout);
    } catch (err) {
      console.warn(`  failed: ${err.message.slice(0, 200)}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

function toFeature(el) {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;
  const t = el.tags || {};
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      id: `${el.type}/${el.id}`,
      source: 'osm',
      name: t.name || null,
      fee: t.fee || null, // yes / no / null(unknown)
      charge: t.charge || null, // e.g. "0.50 EUR"
      access: t.access || null,
      wheelchair: t.wheelchair || null,
      opening_hours: t.opening_hours || null,
      operator: t.operator || null,
      description: t.description || null,
      // user-contributed layer (merged later): password, confirmed_at
      password: null,
    },
  };
}

const data = await fetchOverpass();
const features = data.elements.map(toFeature).filter(Boolean);

const feeStats = features.reduce((acc, f) => {
  const k = f.properties.fee || 'unknown';
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});
console.log(`Fetched ${features.length} toilets. fee breakdown:`, feeStats);

const geojson = {
  type: 'FeatureCollection',
  attribution: '© OpenStreetMap contributors (ODbL)',
  generated_at: new Date().toISOString(),
  features,
};

const { writeFileSync, mkdirSync } = await import('node:fs');
const { dirname } = await import('node:path');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(geojson));
console.log(`Written to ${outputPath}`);
