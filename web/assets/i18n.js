/* FindToilet — i18n (en / zh / es / ja)
 * Usage: t('key'), tf('key', {n: 1}), localizedName(cityOrCountry)
 * Choice persists in localStorage ('ft-lang').
 */
const FT_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
];

const I18N = {
  en: {
    'nav.contribute': 'Contribute',
    'nav.allCities': '← All cities',
    'hero.title': 'Never hunt for a toilet in Europe again.',
    'hero.subtitle': 'Free & paid public toilets — with community-shared door codes — across Europe. Open data, open source, community maintained.',
    'hero.stats': '{c} countries · {n} cities · more coming',
    'browse.title': 'Browse by country',
    'loading': 'Loading…',
    'card1.title': '🔑 Know a door code?',
    'card1.text': 'Paid toilets and cafés in Europe often lock their restrooms with a code. FindToilet lets the community share and confirm those codes — open a toilet on the map and hit “Report / update”.',
    'card2.title': '🌍 Open data',
    'card2.text': 'Toilet locations come from OpenStreetMap (ODbL) and the Toilet Map (CC BY 4.0). Community contributions (codes, corrections, new toilets) live in this repo and are reviewed in the open.',
    'card3.title': '🧭 One-tap navigation',
    'card3.text': 'Every toilet links straight into Google Maps or Apple Maps for walking directions.',
    'footer.osm': 'FindToilet — open source. Toilet data ©',
    'footer.tm': 'Contains data from',
    'map.stats': '{n} toilets · {f} free · {p} paid',
    'legend.free': 'Free',
    'legend.paid': 'Paid',
    'legend.unknown': 'Unknown',
    'legend.code': 'Door code',
    'locate': '📍 Near me',
    'popup.title': 'Public toilet',
    'popup.free': 'Free',
    'popup.paid': 'Paid',
    'popup.feeUnknown': 'Fee unknown',
    'popup.wheelchairYes': '♿ Wheelchair accessible',
    'popup.wheelchairNo': '♿ Not wheelchair accessible',
    'popup.operator': 'Operated by {name}',
    'popup.doorCode': '🔑 Door code',
    'popup.confirmed': 'confirmed {date}',
    'popup.doorCodeUnknown': '🔑 Door code unknown — know it? Hit “Report / update”.',
    'popup.report': '✏️ Report / update this toilet',
    'error.location': 'Could not get your location. Check browser permissions.',
    'error.load': 'Failed to load data: {msg}',
  },
  zh: {
    'nav.contribute': '参与贡献',
    'nav.allCities': '← 全部城市',
    'hero.title': '在欧洲，不再为找厕所发愁。',
    'hero.subtitle': '覆盖欧洲的免费与付费公厕地图——附社区共享的门禁密码。开放数据、开源代码、社区维护。',
    'hero.stats': '{c} 个国家 · {n} 座城市 · 持续增加中',
    'browse.title': '按国家浏览',
    'loading': '加载中…',
    'card1.title': '🔑 知道某个门禁密码？',
    'card1.text': '欧洲的付费厕所和咖啡馆常用密码锁。FindToilet 让社区共享并确认这些密码——在地图上打开一个厕所，点击“上报 / 更新”即可。',
    'card2.title': '🌍 开放数据',
    'card2.text': '厕所位置来自 OpenStreetMap（ODbL）和 Toilet Map（CC BY 4.0）。社区贡献（密码、纠错、新厕所）保存在本仓库中，公开审核。',
    'card3.title': '🧭 一键导航',
    'card3.text': '每个厕所都可直接跳转 Google 地图或 Apple 地图获取步行路线。',
    'footer.osm': 'FindToilet — 开源项目。厕所数据 ©',
    'footer.tm': '包含来自',
    'map.stats': '{n} 个厕所 · {f} 免费 · {p} 付费',
    'legend.free': '免费',
    'legend.paid': '付费',
    'legend.unknown': '未知',
    'legend.code': '有密码',
    'locate': '📍 附近厕所',
    'popup.title': '公共厕所',
    'popup.free': '免费',
    'popup.paid': '付费',
    'popup.feeUnknown': '收费未知',
    'popup.wheelchairYes': '♿ 无障碍可用',
    'popup.wheelchairNo': '♿ 无无障碍设施',
    'popup.operator': '运营方：{name}',
    'popup.doorCode': '🔑 门禁密码',
    'popup.confirmed': '{date} 确认',
    'popup.doorCodeUnknown': '🔑 暂无门禁密码——你知道吗？点“上报 / 更新”。',
    'popup.report': '✏️ 上报 / 更新这个厕所',
    'error.location': '无法获取你的位置，请检查浏览器权限。',
    'error.load': '数据加载失败：{msg}',
  },
  es: {
    'nav.contribute': 'Contribuir',
    'nav.allCities': '← Todas las ciudades',
    'hero.title': 'No vuelvas a buscar un baño en Europa.',
    'hero.subtitle': 'Baños públicos gratuitos y de pago — con códigos de acceso compartidos por la comunidad — en toda Europa. Datos abiertos, código abierto, mantenido por la comunidad.',
    'hero.stats': '{c} países · {n} ciudades · y más en camino',
    'browse.title': 'Explorar por país',
    'loading': 'Cargando…',
    'card1.title': '🔑 ¿Conoces un código?',
    'card1.text': 'Los baños de pago y los cafés en Europa suelen cerrar sus aseos con código. FindToilet permite a la comunidad compartir y confirmar esos códigos: abre un baño en el mapa y pulsa “Reportar / actualizar”.',
    'card2.title': '🌍 Datos abiertos',
    'card2.text': 'Las ubicaciones provienen de OpenStreetMap (ODbL) y del Toilet Map (CC BY 4.0). Las contribuciones de la comunidad (códigos, correcciones, nuevos baños) viven en este repositorio y se revisan abiertamente.',
    'card3.title': '🧭 Navegación con un toque',
    'card3.text': 'Cada baño enlaza directamente con Google Maps o Apple Maps para obtener indicaciones a pie.',
    'footer.osm': 'FindToilet — código abierto. Datos de baños ©',
    'footer.tm': 'Contiene datos de',
    'map.stats': '{n} baños · {f} gratis · {p} de pago',
    'legend.free': 'Gratis',
    'legend.paid': 'De pago',
    'legend.unknown': 'Desconocido',
    'legend.code': 'Con código',
    'locate': '📍 Cerca de mí',
    'popup.title': 'Baño público',
    'popup.free': 'Gratis',
    'popup.paid': 'De pago',
    'popup.feeUnknown': 'Precio desconocido',
    'popup.wheelchairYes': '♿ Accesible en silla de ruedas',
    'popup.wheelchairNo': '♿ No accesible en silla de ruedas',
    'popup.operator': 'Operado por {name}',
    'popup.doorCode': '🔑 Código de acceso',
    'popup.confirmed': 'confirmado {date}',
    'popup.doorCodeUnknown': '🔑 Código desconocido — ¿lo sabes? Pulsa “Reportar / actualizar”.',
    'popup.report': '✏️ Reportar / actualizar este baño',
    'error.location': 'No se pudo obtener tu ubicación. Revisa los permisos del navegador.',
    'error.load': 'Error al cargar los datos: {msg}',
  },
  ja: {
    'nav.contribute': '貢献する',
    'nav.allCities': '← すべての都市',
    'hero.title': 'ヨーロッパでトイレ探しに困らない。',
    'hero.subtitle': 'ヨーロッパ全土の無料・有料公衆トイレ——コミュニティ共有のドアコード付き。オープンデータ、オープンソース、コミュニティ運営。',
    'hero.stats': '{c}か国 · {n}都市 · 今後も追加',
    'browse.title': '国から探す',
    'loading': '読み込み中…',
    'card1.title': '🔑 ドアコードを知っていますか？',
    'card1.text': 'ヨーロッパの有料トイレやカフェは暗証番号で施錠されていることがよくあります。FindToilet ではコミュニティがコードを共有・確認できます。地図でトイレを開き「報告 / 更新」をタップしてください。',
    'card2.title': '🌍 オープンデータ',
    'card2.text': 'トイレの位置情報は OpenStreetMap（ODbL）と Toilet Map（CC BY 4.0）から取得しています。コミュニティの投稿（コード、修正、新規トイレ）はこのリポジトリで公開審査されます。',
    'card3.title': '🧭 ワンタップナビ',
    'card3.text': 'すべてのトイレは Google マップまたは Apple マップに直接リンクし、徒歩ルートを表示できます。',
    'footer.osm': 'FindToilet — オープンソース。トイレデータ ©',
    'footer.tm': 'データ提供：',
    'map.stats': '{n}件のトイレ · 無料 {f} · 有料 {p}',
    'legend.free': '無料',
    'legend.paid': '有料',
    'legend.unknown': '不明',
    'legend.code': 'コード有',
    'locate': '📍 現在地から探す',
    'popup.title': '公衆トイレ',
    'popup.free': '無料',
    'popup.paid': '有料',
    'popup.feeUnknown': '料金不明',
    'popup.wheelchairYes': '♿ 車椅子対応',
    'popup.wheelchairNo': '♿ 車椅子非対応',
    'popup.operator': '運営：{name}',
    'popup.doorCode': '🔑 ドアコード',
    'popup.confirmed': '{date} 確認済み',
    'popup.doorCodeUnknown': '🔑 ドアコード不明——知っていますか？「報告 / 更新」へ。',
    'popup.report': '✏️ このトイレを報告 / 更新',
    'error.location': '現在地を取得できませんでした。ブラウザの権限を確認してください。',
    'error.load': 'データの読み込みに失敗しました：{msg}',
  },
};

function getLang() {
  // ?lang=zh overrides stored choice (useful for sharing localized links)
  const url = new URLSearchParams(location.search).get('lang');
  if (FT_LANGS.some(x => x.code === url)) return url;
  const l = localStorage.getItem('ft-lang');
  return FT_LANGS.some(x => x.code === l) ? l : 'en';
}
function setLang(code) { localStorage.setItem('ft-lang', code); }
function t(key) {
  const l = getLang();
  return (I18N[l] && I18N[l][key]) ?? I18N.en[key] ?? key;
}
function tf(key, vars) {
  let s = t(key);
  for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
}
function localizedName(obj) {
  const l = getLang();
  return (obj.names && obj.names[l]) || obj.name;
}
function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.documentElement.lang = getLang() === 'zh' ? 'zh-CN' : getLang();
}
