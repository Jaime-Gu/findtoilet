# FindToilet

Free & paid public toilets across Europe — with community-shared door codes.
Open source, open data, community maintained.

**Live: https://jaime-gu.github.io/findtoilet/web/**

## Why

Public toilets in much of Europe are paid (€0.5–2) or locked behind door codes
(cafés, fast food, stations). No existing map shares those codes. FindToilet does.

## Features

- 🗺️ Country → city drill-down with zoomed-out city overview bubbles (tap a bubble to jump cities)
- 🟢 Free / 🟠 paid / ⚪ unknown / 🔑 door-code pin states
- 🧭 One-tap navigation via Google Maps / Apple Maps
- 🌐 UI in 6 languages: English, 中文, Español, 日本語, 한국어, Français
- 📍 "Near me" geolocation, deep links to individual toilets
- 🎨 Minimal Apple-style UI, brand teal `#0F6773`

## Current coverage

**12 countries · 23 cities · 9,070 toilets**

- 🇫🇷 France: Paris, Marseille
- 🇮🇹 Italy: Rome, Milan, Naples
- 🇪🇸 Spain: Barcelona, Madrid
- 🇳🇱 Netherlands: Amsterdam, The Hague
- 🇩🇪 Germany: Berlin, Cologne
- 🇨🇿 Czechia: Prague · 🇦🇹 Austria: Vienna · 🇧🇪 Belgium: Brussels
- 🇵🇹 Portugal: Lisbon · 🇭🇺 Hungary: Budapest · 🇮🇪 Ireland: Dublin
- 🇬🇧 UK: London, Manchester, Edinburgh, Birmingham, Bristol, Glasgow
  (from the Toilet Map open dataset, CC BY 4.0)

## Stack

- Static site: Leaflet + CARTO/OSM tiles + marker clustering (`web/`), zero backend
- Toilet data: OpenStreetMap via Overpass API + Toilet Map UK open dataset,
  generated into per-city GeoJSON (`data/toilets/<country>/<city>.geojson`)
- i18n: `web/assets/i18n.js` (UI strings) + `names` fields in `data/cities.json`
- Community layer (door codes, corrections): planned, see roadmap
- Hosting: GitHub Pages (auto-deploys from `main`)

## Development

```bash
# fetch/refresh OSM cities (all, or specific ones by code)
node scripts/fetch-cities.mjs
node scripts/fetch-cities.mjs milan naples

# refresh UK cities from the Toilet Map dataset
node scripts/import-toiletmap-uk.mjs

# preview locally (serve the repo root, pages live under web/)
python3 -m http.server 8765
# open http://localhost:8765/web/
```

Deep link to a single toilet:
`web/map.html?city=france/paris&toilet=node/1128854285`
Force a language: add `&lang=zh` (en/zh/es/ja/ko/fr).

## Roadmap

- [ ] Community overrides: door codes with `confirmed_at`, add/edit/delete via GitHub Issues/PRs
- [ ] Weekly data refresh via GitHub Actions
- [x] i18n (6 languages)
- [ ] PWA: installable, offline city data
- [ ] More cities (contributions welcome)

## Data & attribution

- Toilet locations © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0
- UK: Contains data from [the Toilet Map](https://www.toiletmap.org.uk/dataset) © 2025 – CC BY 4.0
- Basemaps © CARTO (Positron/Voyager) and OpenStreetMap
- Door-code policy: only codes that are publicly posted or shared by the venue.

## License

Code: MIT. Data: ODbL (OSM) and CC BY 4.0 (Toilet Map), community contributions under the same terms.
