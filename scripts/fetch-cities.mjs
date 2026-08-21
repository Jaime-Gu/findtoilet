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

// 10 major European mainland tourist cities (UK intentionally excluded for now)
const CITIES = [
  { code: 'rome',      name: 'Rome',      country: 'italy',       countryName: 'Italy',        q: 'Rome, Italy' },
  { code: 'barcelona', name: 'Barcelona', country: 'spain',       countryName: 'Spain',        q: 'Barcelona, Spain' },
  { code: 'madrid',    name: 'Madrid',    country: 'spain',       countryName: 'Spain',        q: 'Madrid, Spain' },
  { code: 'amsterdam', name: 'Amsterdam', country: 'netherlands', countryName: 'Netherlands',  q: 'Amsterdam, Netherlands' },
  { code: 'berlin',    name: 'Berlin',    country: 'germany',     countryName: 'Germany',      q: 'Berlin, Germany' },
  { code: 'prague',    name: 'Prague',    country: 'czechia',     countryName: 'Czechia',      q: 'Prague, Czechia' },
  { code: 'vienna',    name: 'Vienna',    country: 'austria',     countryName: 'Austria',      q: 'Vienna, Austria' },
  { code: 'brussels',  name: 'Brussels',  country: 'belgium',     countryName: 'Belgium',      q: 'Brussels, Belgium' },
  { code: 'lisbon',    name: 'Lisbon',    country: 'portugal',    countryName: 'Portugal',     q: 'Lisbon, Portugal' },
  { code: 'budapest',  name: 'Budapest',  country: 'hungary',     countryName: 'Hungary',      q: 'Budapest, Hungary' },
];

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
    country.cities = country.cities.filter(c => c.code !== city.code);
    country.cities.push({
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
