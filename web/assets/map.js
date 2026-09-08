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
  if (p.cleanliness === 'clean') rows.push(`<div class="popup-row">${t('popup.clean')}</div>`);
  if (p.description) rows.push(`<div class="popup-row popup-muted">${esc(p.description)}</div>`);

  const codeBlock = p.password
    ? `<div class="door-code">
         <span class="door-code-label">${t('popup.doorCode')}</span>
         <span class="door-code-value">${esc(p.password)}</span>
         ${p.code_confirmed_at ? `<span class="door-code-meta">${tf('popup.confirmed', { date: esc(p.code_confirmed_at) })}</span>` : ''}
       </div>`
    : `<div class="door-code door-code-empty">${t('popup.doorCodeUnknown')}</div>`;

  const sourceLine = p.source === 'xhs'
    ? `<div class="popup-row popup-muted popup-source">${t('popup.sourceXhs')}</div>`
    : '';

  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const amaps = `https://maps.apple.com/?daddr=${lat},${lng}`;

  return `
    <div class="popup">
      <div class="popup-title">${p.name ? esc(p.name) : t('popup.title')}</div>
      <div class="popup-badges">${feeBadge(p)}</div>
      ${rows.join('')}
      ${codeBlock}
      ${sourceLine}
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

  // Base layers. Default: OSM France HOT (clean light style, keyless, z19).
  const osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, and the GIS User Community';
  const baseLayers = {
    'Light': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19, subdomains: 'abc', attribution: osmAttr,
    }),
    'OSM France': L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      maxZoom: 19, subdomains: 'abc', attribution: osmAttr,
    }),
    'Esri Streets': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: esriAttr,
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
  const allMarkers = [];
  for (const f of data.features) {
    const p = f.properties;
    if (p.fee === 'no') counts.free++;
    else if (p.fee === 'yes') counts.paid++;
    else counts.unknown++;
    const [lng, lat] = f.geometry.coordinates;
    const marker = L.marker([lat, lng], { icon: makeIcon(p) }).bindPopup(popupHtml(f), {
      maxWidth: 300,
      // keep popups below the floating header/toolbar (~150px): auto-pan the
      // map instead of letting popups slide under the glass bars
      autoPanPadding: L.point(10, 190),
      keepInView: true,
    });
    byId.set(p.id, marker);
    allMarkers.push({ f, marker });
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
  document.getElementById('sidebar-title').textContent =
    tf('list.title', { n: data.features.length });
  document.getElementById('list-fab-label').textContent =
    `☰ ${t('list.button')} · ${data.features.length}`;

  // ---- sidebar list (desktop: always visible; mobile: overlay via FAB) ----
  const listEl = document.getElementById('toilet-list');
  const sidebar = document.getElementById('sidebar');
  const sortBtn = document.getElementById('sort-distance');
  let userPos = null; // [lng, lat]
  let activeFilter = 'all';

  function passesFilter(p) {
    if (activeFilter === 'free') return p.fee === 'no';
    if (activeFilter === 'paid') return p.fee === 'yes';
    if (activeFilter === 'wheelchair') return p.wheelchair === 'yes';
    if (activeFilter === 'code') return !!p.password;
    return true;
  }

  function applyFilter() {
    const filtered = data.features.filter(f => passesFilter(f.properties));
    // map markers follow the filter too
    cluster.clearLayers();
    cluster.addLayers(allMarkers.filter(m => passesFilter(m.f.properties)).map(m => m.marker));
    document.getElementById('sidebar-title').textContent = tf('list.title', { n: filtered.length });
    return filtered;
  }

  document.getElementById('filter-row').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    document.querySelectorAll('#filter-row .chip').forEach(c => c.classList.toggle('active', c === chip));
    renderList();
  });

  function distMeters(from, coords) {
    const R = 6371000, rad = Math.PI / 180;
    const [lng1, lat1] = from, [lng2, lat2] = coords;
    const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  function fmtDist(m) { return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`; }

  function renderList() {
    const items = applyFilter().map(f => ({
      f, d: userPos ? distMeters(userPos, f.geometry.coordinates) : null,
    }));
    if (userPos) items.sort((a, b) => a.d - b.d);
    listEl.innerHTML = items.map(({ f, d }) => {
      const p = f.properties;
      const name = p.name ? esc(p.name) : t('popup.title');
      const meta = [];
      if (p.wheelchair === 'yes') meta.push('♿');
      if (p.opening_hours) meta.push(`🕒 ${esc(p.opening_hours)}`);
      if (p.password) meta.push('🔑');
      return `<div class="t-item" data-id="${esc(p.id)}">
        <div class="t-item-main">
          <div class="t-item-head"><span class="t-name">${name}</span>${feeBadge(p)}</div>
          ${meta.length ? `<div class="t-meta">${meta.join(' · ')}</div>` : ''}
        </div>
        ${d != null ? `<div class="t-dist">${fmtDist(d)}</div>` : ''}
      </div>`;
    }).join('');
  }
  renderList();

  listEl.addEventListener('click', e => {
    const item = e.target.closest('.t-item');
    if (!item) return;
    const marker = byId.get(item.dataset.id);
    if (!marker) return;
    sidebar.classList.remove('open');
    map.flyTo(marker.getLatLng(), 17);
    cluster.zoomToShowLayer(marker, () => marker.openPopup());
  });

  sortBtn.addEventListener('click', () => {
    if (userPos) {
      userPos = null;
      sortBtn.classList.remove('active');
      renderList();
      return;
    }
    if (!navigator.geolocation) { alert(t('error.location')); return; }
    sortBtn.textContent = t('list.locating');
    navigator.geolocation.getCurrentPosition(
      pos => {
        userPos = [pos.coords.longitude, pos.coords.latitude];
        sortBtn.classList.add('active');
        sortBtn.textContent = t('list.sort');
        renderList();
      },
      () => {
        sortBtn.textContent = t('list.sort');
        alert(t('error.location'));
      },
      { timeout: 10000 }
    );
  });

  document.getElementById('list-fab').addEventListener('click', () => sidebar.classList.add('open'));
  document.getElementById('sidebar-close').addEventListener('click', () => sidebar.classList.remove('open'));

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
