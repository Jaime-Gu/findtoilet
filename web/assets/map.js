/* FindToilet — map page logic
 * Loads a city's GeoJSON and renders toilets on a Leaflet map.
 * Toilet data © OpenStreetMap contributors (ODbL); UK: Toilet Map (CC BY 4.0).
 * UI strings via i18n.js (en/zh/es/ja).
 */

const MARKER_COLORS = {
  free: '#22C55E',    // green
  paid: '#F59E0B',    // amber
  unknown: '#94A3B8', // slate
  code: '#0F6773',    // brand teal — has door code
};

const REPORT_URL = 'https://github.com/Jaime-Gu/findtoilet/issues/new';

function markerColor(props) {
  if (props.password) return MARKER_COLORS.code;
  if (props.fee === 'no') return MARKER_COLORS.free;
  if (props.fee === 'yes') return MARKER_COLORS.paid;
  return MARKER_COLORS.unknown;
}

function makeIcon(props) {
  const color = markerColor(props);
  const inner = props.password ? '🔑' : '<img class="pin-icon" src="assets/toilet-icon.png" width="19" height="19" style="width:19px;height:auto;display:block" alt="" />';
  return L.divIcon({
    className: 'toilet-marker',
    html: `<span class="pin" style="--pin-color:${color}">${inner}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function feeBadge(p) {
  if (p.fee === 'no') return `<span class="badge badge-free">${t('popup.free')}</span>`;
  if (p.fee === 'yes') return `<span class="badge badge-paid">${t('popup.paid')}${p.charge ? ' · ' + esc(p.charge) : ''}</span>`;
  return `<span class="badge badge-unknown">${t('popup.feeUnknown')}</span>`;
}

function popupHtml(f) {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  const rows = [];

  if (p.wheelchair === 'yes') rows.push(`<div class="popup-row">${t('popup.wheelchairYes')}</div>`);
  else if (p.wheelchair === 'no') rows.push(`<div class="popup-row popup-muted">${t('popup.wheelchairNo')}</div>`);
  if (p.opening_hours) rows.push(`<div class="popup-row">🕒 ${esc(p.opening_hours)}</div>`);
  if (p.operator) rows.push(`<div class="popup-row popup-muted">${tf('popup.operator', { name: esc(p.operator) })}</div>`);

  const codeBlock = p.password
    ? `<div class="door-code">
         <span class="door-code-label">${t('popup.doorCode')}</span>
         <span class="door-code-value">${esc(p.password)}</span>
         ${p.code_confirmed_at ? `<span class="door-code-meta">${tf('popup.confirmed', { date: esc(p.code_confirmed_at) })}</span>` : ''}
       </div>`
    : `<div class="door-code door-code-empty">${t('popup.doorCodeUnknown')}</div>`;

  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const amaps = `https://maps.apple.com/?daddr=${lat},${lng}`;

  return `
    <div class="popup">
      <div class="popup-title">${p.name ? esc(p.name) : t('popup.title')}</div>
      <div class="popup-badges">${feeBadge(p)}</div>
      ${rows.join('')}
      ${codeBlock}
      <div class="popup-actions">
        <a class="btn btn-google" href="${gmaps}" target="_blank" rel="noopener">Google Maps</a>
        <a class="btn btn-apple" href="${amaps}" target="_blank" rel="noopener">Apple Maps</a>
      </div>
      <a class="report-link" href="${REPORT_URL}" target="_blank" rel="noopener">${t('popup.report')}</a>
    </div>`;
}

async function resolveCity() {
  const param = new URLSearchParams(location.search).get('city') || 'france/paris';
  const res = await fetch('../data/cities.json');
  const index = await res.json();
  for (const country of index.countries) {
    for (const city of country.cities) {
      if (`${country.code}/${city.code}` === param) {
        return { city: { ...city, dataPath: `../${city.data}` }, country, index };
      }
    }
  }
  throw new Error(`Unknown city: ${param}`);
}

(async () => {
  applyI18n();
  // popups are pre-built with the active language — simplest correct refresh is a reload
  document.addEventListener('ft-langchange', () => location.reload());

  const { city, country, index } = await resolveCity();
  document.getElementById('map-city').textContent = `${localizedName(city)}, ${localizedName(country)}`;
  document.title = `FindToilet — ${localizedName(city)}`;

  const map = L.map('map', { zoomControl: true }).setView(city.center, Number(new URLSearchParams(location.search).get('zoom')) || city.zoom);

  // Base layers: minimal CARTO styles by default (cleaner look, Apple-style),
  // OSM standard kept as an option. All are live raster tile services.
  const osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const baseLayers = {
    'Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20, subdomains: 'abcd',
      attribution: `${osmAttr} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    }),
    'Voyager': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20, subdomains: 'abcd',
      attribution: `${osmAttr} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    }),
    'OSM Standard': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: osmAttr,
    }),
  };
  baseLayers['Light'].addTo(map);
  L.control.layers(baseLayers, null, { position: 'bottomright' }).addTo(map);

  const res = await fetch(city.dataPath);
  const data = await res.json();

  const cluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 48,
  });

  const counts = { free: 0, paid: 0, unknown: 0 };
  const byId = new Map();
  for (const f of data.features) {
    const p = f.properties;
    if (p.fee === 'no') counts.free++;
    else if (p.fee === 'yes') counts.paid++;
    else counts.unknown++;
    const [lng, lat] = f.geometry.coordinates;
    const marker = L.marker([lat, lng], { icon: makeIcon(p) }).bindPopup(popupHtml(f), { maxWidth: 300 });
    byId.set(p.id, marker);
    cluster.addLayer(marker);
  }
  cluster.addTo(map);

  // Deep link: map.html?city=france/paris&toilet=node/433323483 opens that toilet's popup
  const toiletParam = new URLSearchParams(location.search).get('toilet');
  if (toiletParam && byId.has(toiletParam)) {
    const marker = byId.get(toiletParam);
    cluster.zoomToShowLayer(marker, () => marker.openPopup());
  }

  // City overview: zoomed out, show one count bubble per city across Europe;
  // clicking a bubble jumps to that city's map.
  const cityLayer = L.layerGroup();
  for (const c of index.countries) {
    for (const cty of c.cities) {
      if (!cty.count) continue;
      const icon = L.divIcon({
        className: 'city-bubble-anchor',
        html: `<div class="city-bubble"><strong>${cty.count}</strong><span>${esc(localizedName(cty))}</span></div>`,
        iconSize: [0, 0],
      });
      L.marker(cty.center, { icon })
        .on('click', () => { location.href = `map.html?city=${c.code}/${cty.code}`; })
        .addTo(cityLayer);
    }
  }
  const OVERVIEW_ZOOM = 9;
  function toggleOverview() {
    if (map.getZoom() <= OVERVIEW_ZOOM) {
      map.removeLayer(cluster);
      if (!map.hasLayer(cityLayer)) cityLayer.addTo(map);
    } else {
      map.removeLayer(cityLayer);
      if (!map.hasLayer(cluster)) cluster.addTo(map);
    }
  }
  map.on('zoomend', toggleOverview);
  toggleOverview();

  document.getElementById('map-count').textContent =
    tf('map.stats', { n: data.features.length, f: counts.free, p: counts.paid });

  document.getElementById('locate-btn').addEventListener('click', () => {
    map.locate({ setView: true, maxZoom: 16 });
  });
  map.on('locationfound', e => {
    L.circleMarker(e.latlng, {
      radius: 8, color: '#0A4E58', weight: 3, fillColor: '#0F6773', fillOpacity: 0.6,
    }).addTo(map);
  });
  map.on('locationerror', () => alert(t('error.location')));
})().catch(err => {
  document.getElementById('map-city').textContent = `Error: ${err.message}`;
});
