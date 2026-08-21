#!/usr/bin/env node
/**
 * FindToilet — import toilets from the Great British Public Toilet Map open dataset.
 * Dataset: https://www.toiletmap.org.uk/dataset — CC BY 4.0
 * Required attribution: "Contains data from the Toilet Map © 2025 – CC BY 4.0"
 *
 * The export is organised by council area, so cities are cut out by bounding box.
 * Usage: node scripts/import-toiletmap-uk.mjs
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';

const DATASET_PAGE = 'https://www.toiletmap.org.uk/dataset';

// UK cities (bounding boxes, [minLat, minLng, maxLat, maxLng])
const CITIES = [
  { code: 'london',     name: 'London',     center: [51.5074, -0.1278], bbox: [51.28, -0.51, 51.70, 0.33] },
  { code: 'manchester', name: 'Manchester', center: [53.4808, -2.2426], bbox: [53.35, -2.35, 53.55, -2.15] },
  { code: 'edinburgh',  name: 'Edinburgh',  center: [55.9533, -3.1883], bbox: [55.89, -3.35, 55.99, -3.05] },
  { code: 'birmingham', name: 'Birmingham', center: [52.4862, -1.8904], bbox: [52.38, -2.00, 52.56, -1.80] },
  { code: 'bristol',    name: 'Bristol',    center: [51.4545, -2.5879], bbox: [51.40, -2.70, 51.52, -2.50] },
  { code: 'glasgow',    name: 'Glasgow',    center: [55.8642, -4.2518], bbox: [55.80, -4.35, 55.90, -4.15] },
];

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** toiletmap opening_times: 7 entries Mon..Sun, each [open, close] or [] (closed) */
function formatOpening(times) {
  if (!Array.isArray(times) || times.length !== 7) return null;
  const parts = [];
  let i = 0;
  while (i < 7) {
    const t = times[i];
    if (!Array.isArray(t) || t.length < 2) { i++; continue; }
    let j = i;
    while (j + 1 < 7 && Array.isArray(times[j + 1]) && times[j + 1][0] === t[0] && times[j + 1][1] === t[1]) j++;
    parts.push(`${i === j ? DAYS[i] : `${DAYS[i]}-${DAYS[j]}`} ${t[0]}-${t[1]}`);
    i = j + 1;
  }
  return parts.length ? parts.join('; ') : null;
}

async function findExportUrl() {
  const res = await fetch(DATASET_PAGE, { headers: { 'User-Agent': 'FindToilet/0.1' } });
  if (!res.ok) throw new Error(`dataset page HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/href="(https:[^"]+\.json\?download=1)"/);
  if (!match) throw new Error('export JSON link not found on dataset page');
  return match[1];
}

function toFeature(r) {
  if (!r.location?.coordinates) return null;
  const [lng, lat] = r.location.coordinates;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      id: `toiletmap/${r.id}`,
      source: 'toiletmap-uk',
      name: r.name || null,
      fee: r.no_payment === true ? 'no' : r.no_payment === false ? 'yes' : null,
      charge: r.payment_details || null,
      access: null,
      wheelchair: r.accessible === true ? 'yes' : r.accessible === false ? 'no' : null,
      opening_hours: formatOpening(r.opening_times),
      operator: null,
      description: r.notes || null,
      password: null,
    },
  };
}

console.log('Locating latest export...');
const url = await findExportUrl();
console.log(`Downloading ${url.slice(0, 90)}...`);
const res = await fetch(url);
if (!res.ok) throw new Error(`export HTTP ${res.status}`);
const records = await res.json();
console.log(`${records.length} records in export`);

const index = JSON.parse(readFileSync('data/cities.json', 'utf8'));
let country = index.countries.find(c => c.code === 'uk');
if (!country) {
  country = { code: 'uk', name: 'United Kingdom', cities: [] };
  index.countries.push(country);
}

for (const city of CITIES) {
  const [minLat, minLng, maxLat, maxLng] = city.bbox;
  const features = records
    .filter(r => r.active && r.location?.coordinates)
    .filter(r => {
      const [lng, lat] = r.location.coordinates;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    })
    .map(toFeature)
    .filter(Boolean);

  const out = `data/toilets/uk/${city.code}.geojson`;
  mkdirSync('data/toilets/uk', { recursive: true });
  writeFileSync(out, JSON.stringify({
    type: 'FeatureCollection',
    attribution: 'Contains data from the Toilet Map © 2025 – CC BY 4.0 (https://www.toiletmap.org.uk/dataset)',
    generated_at: new Date().toISOString(),
    features,
  }));

  country.cities = country.cities.filter(c => c.code !== city.code);
  country.cities.push({ code: city.code, name: city.name, center: city.center, zoom: 12, data: out, osm_relation: null, count: features.length });
  console.log(`${city.name}: ${features.length} toilets → ${out}`);
}

writeFileSync('data/cities.json', JSON.stringify(index, null, 2) + '\n');
console.log('cities.json updated');
