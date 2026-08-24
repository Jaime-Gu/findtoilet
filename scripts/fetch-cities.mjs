#!/usr/bin/env node
/**
 * FindToilet — batch import cities.
 * Looks up each city's OSM relation via Nominatim, fetches its toilets via
 * fetch-osm-toilets.mjs, then rewrites data/cities.json.
 *
 * Usage: node scripts/fetch-cities.mjs
 * Respects Nominatim (<=1 req/s) and Overpass (sequential) rate limits.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';

const execFileP = promisify(execFile);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// European cities (OSM source). Run with city codes to fetch a subset:
//   node scripts/fetch-cities.mjs milan naples
const ALL_CITIES = [
  { code: 'rome',      name: 'Rome',      country: 'italy',       countryName: 'Italy',        q: 'Rome, Italy' },
  { code: 'milan',     name: 'Milan',     country: 'italy',       countryName: 'Italy',        q: 'Milan, Italy' },
  { code: 'naples',    name: 'Naples',    country: 'italy',       countryName: 'Italy',        q: 'Naples, Italy' },
  { code: 'barcelona', name: 'Barcelona', country: 'spain',       countryName: 'Spain',        q: 'Barcelona, Spain' },
  { code: 'madrid',    name: 'Madrid',    country: 'spain',       countryName: 'Spain',        q: 'Madrid, Spain' },
  { code: 'amsterdam', name: 'Amsterdam', country: 'netherlands', countryName: 'Netherlands',  q: 'Amsterdam, Netherlands' },
  { code: 'the-hague', name: 'The Hague', country: 'netherlands', countryName: 'Netherlands',  q: 'The Hague, Netherlands' },
  { code: 'berlin',    name: 'Berlin',    country: 'germany',     countryName: 'Germany',      q: 'Berlin, Germany' },
  { code: 'cologne',   name: 'Cologne',   country: 'germany',     countryName: 'Germany',      q: 'Cologne, Germany' },
  { code: 'prague',    name: 'Prague',    country: 'czechia',     countryName: 'Czechia',      q: 'Prague, Czechia' },
  { code: 'vienna',    name: 'Vienna',    country: 'austria',     countryName: 'Austria',      q: 'Vienna, Austria' },
  { code: 'brussels',  name: 'Brussels',  country: 'belgium',     countryName: 'Belgium',      q: 'Brussels, Belgium' },
  { code: 'lisbon',    name: 'Lisbon',    country: 'portugal',    countryName: 'Portugal',     q: 'Lisbon, Portugal' },
  { code: 'budapest',  name: 'Budapest',  country: 'hungary',     countryName: 'Hungary',      q: 'Budapest, Hungary' },
  { code: 'marseille', name: 'Marseille', country: 'france',      countryName: 'France',       q: 'Marseille, France' },
  { code: 'dublin',    name: 'Dublin',    country: 'ireland',     countryName: 'Ireland',      q: 'Dublin, Ireland' },
  { code: 'florence',  name: 'Florence',  country: 'italy',       countryName: 'Italy',        q: 'Florence, Italy' },
  { code: 'venice',    name: 'Venice',    country: 'italy',       countryName: 'Italy',        q: 'Venice, Italy' },
  { code: 'lyon',      name: 'Lyon',      country: 'france',      countryName: 'France',       q: 'Lyon, France' },
  { code: 'seville',   name: 'Seville',   country: 'spain',       countryName: 'Spain',        q: 'Seville, Spain' },
  { code: 'la-spezia', name: 'La Spezia', country: 'italy',       countryName: 'Italy',        q: 'La Spezia, Italy' },
  { code: 'versailles', name: 'Versailles', country: 'france',    countryName: 'France',       q: 'Versailles, France' },
  { code: 'valencia',  name: 'Valencia',  country: 'spain',       countryName: 'Spain',        q: 'Valencia, Spain' },
  { code: 'toledo',    name: 'Toledo',    country: 'spain',       countryName: 'Spain',        q: 'Toledo, Spain' },
];

const wanted = process.argv.slice(2);
const CITIES = wanted.length ? ALL_CITIES.filter(c => wanted.includes(c.code)) : ALL_CITIES;
if (wanted.length && CITIES.length !== wanted.length) {
  const found = new Set(CITIES.map(c => c.code));
  console.error('Unknown city codes:', wanted.filter(w => !found.has(w)).join(', '));
  process.exit(1);
}

async function lookupRelation(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=5`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FindToilet/0.1 (open-source toilet map)' },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status} for ${q}`);
  const results = await res.json();
  const rel = results.find(r => r.osm_type === 'relation') || results[0];
  if (!rel) throw new Error(`Nominatim: no result for ${q}`);
  return { relationId: rel.osm_id, lat: Number(rel.lat), lon: Number(rel.lon) };
}

const index = JSON.parse(readFileSync('data/cities.json', 'utf8'));
const summary = [];

for (const city of CITIES) {
  console.log(`\n=== ${city.name} ===`);
  try {
    const { relationId, lat, lon } = await lookupRelation(city.q);
    console.log(`relation ${relationId}, center ${lat},${lon}`);
    await sleep(1200); // Nominatim rate limit

    const out = `data/toilets/${city.country}/${city.code}.geojson`;
    const { stdout } = await execFileP('node', ['scripts/fetch-osm-toilets.mjs', String(relationId), out]);
    process.stdout.write(stdout);
    summary.push(`${city.name}: ${stdout.match(/Fetched (\d+) toilets/)?.[1] ?? '?'} toilets`);

    let country = index.countries.find(c => c.code === city.country);
    if (!country) {
      country = { code: city.country, name: city.countryName, cities: [] };
      index.countries.push(country);
    }
    const count = Number(stdout.match(/Fetched (\d+) toilets/)?.[1] ?? 0) || null;
    const prev = country.cities.find(c => c.code === city.code);
    country.cities = country.cities.filter(c => c.code !== city.code);
    country.cities.push({
      ...prev, // preserve names (i18n) and other fields across re-fetches
      code: city.code, name: city.name,
      center: [lat, lon], zoom: 13,
      data: out, osm_relation: relationId, count,
    });
    writeFileSync('data/cities.json', JSON.stringify(index, null, 2) + '\n');
    await sleep(2000); // be nice to Overpass
  } catch (err) {
    console.error(`FAILED ${city.name}: ${err.message}`);
    summary.push(`${city.name}: FAILED`);
  }
}

console.log('\n--- Summary ---');
summary.forEach(s => console.log(s));
