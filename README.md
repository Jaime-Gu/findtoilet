# FindToilet

Free & paid public toilets across Europe — with community-shared door codes.
Open source, open data, community maintained.

## Why

Public toilets in much of Europe are paid (€0.5–2) or locked behind door codes
(cafés, fast food, stations). No existing map shares those codes. FindToilet does.

## Stack

- Static site: Leaflet + OpenStreetMap tiles + marker clustering (`web/`)
- Toilet data: OpenStreetMap (`amenity=toilets`) via Overpass API, generated into
  per-city GeoJSON (`data/toilets/<country>/<city>.geojson`)
- Community layer (door codes, corrections, new toilets): `overrides/` — planned, see roadmap
- Zero backend, zero cost: deployable to GitHub Pages / Cloudflare Pages

## Development

```bash
# fetch/refresh a city's toilets (example: Paris, OSM relation 71525)
node scripts/fetch-osm-toilets.mjs 71525 data/toilets/france/paris.geojson

# preview locally (serve the repo root, pages live under web/)
python3 -m http.server 8765
# open http://localhost:8765/web/
```

Deep link to a single toilet:
`web/map.html?city=france/paris&toilet=node/1128854285`

## Current coverage

- 🇫🇷 Paris — 931 toilets (OSM)
- 🇩🇪 Berlin · 🇦🇹 Vienna · 🇭🇺 Budapest · 🇨🇿 Prague · 🇪🇸 Madrid · 🇪🇸 Barcelona · 🇮🇹 Rome · 🇵🇹 Lisbon · 🇳🇱 Amsterdam · 🇧🇪 Brussels — ~4,300 toilets (OSM)
- 🇬🇧 London, Manchester, Edinburgh, Birmingham, Bristol, Glasgow — 2,968 toilets (Toilet Map open dataset, CC BY 4.0)

Refresh all data:

```bash
node scripts/fetch-cities.mjs        # OSM cities
node scripts/import-toiletmap-uk.mjs # UK (Toilet Map dataset)
```

## Roadmap

- [ ] Community overrides: door codes with `confirmed_at`, add/edit/delete via GitHub Issues/PRs
- [ ] UK: import toiletmap.org.uk open dataset (CC BY 4.0)
- [ ] Top-20 European tourist cities
- [ ] Weekly data refresh via GitHub Actions
- [ ] i18n (EN/ZH)

## Data & attribution

- Toilet locations © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0
- UK: Contains data from [the Toilet Map](https://www.toiletmap.org.uk/dataset) © 2025 – CC BY 4.0
- Door-code policy: only codes that are publicly posted or shared by the venue.

## License

Code: MIT. Data: ODbL (OSM) and CC BY 4.0 (Toilet Map), community contributions under the same terms.
