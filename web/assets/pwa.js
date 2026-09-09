/* FindToilet PWA helper
 * - registers sw.js, shows a refresh toast when a new version is waiting
 * - install prompts: custom button (Android/desktop) or iOS "Add to Home Screen" hint
 * - map page: per-city "Download for offline" toggle (city GeoJSON via SW cache)
 * UI strings via i18n.js (t / tf).
 */
(() => {
  'use strict';

  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  const canSW = 'serviceWorker' in navigator && (location.protocol === 'https:' || isLocalhost);

  const isInstalled = () =>
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  /* ---------------- service worker + update toast ---------------- */

  function showUpdateToast(reg) {
    if (document.getElementById('pwa-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'pwa-toast';
    toast.className = 'pwa-toast';
    toast.innerHTML = `
      <span>${t('pwa.update')}</span>
      <button type="button" class="pwa-toast-btn">${t('pwa.refresh')}</button>`;
    document.body.appendChild(toast);
    toast.querySelector('button').addEventListener('click', () => {
      reg.waiting && reg.waiting.postMessage('SKIP_WAITING');
    });
  }

  if (canSW) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });

    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('sw.js');
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast(reg);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast(reg);
          });
        });
      } catch (err) {
        console.warn('SW registration failed:', err);
      }
    });
  }

  /* ---------------- install prompts ---------------- */

  function injectInstallButton(onClick) {
    const nav = document.querySelector('.site-nav');
    if (!nav || document.getElementById('pwa-install-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'pwa-install-btn';
    btn.className = 'nav-cta pwa-install-btn';
    btn.textContent = t('pwa.install');
    btn.addEventListener('click', onClick);
    nav.insertBefore(btn, nav.querySelector('.lang-switcher'));
  }

  // Android / desktop Chrome: native prompt deferred behind our button
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    if (isInstalled()) return;
    deferredPrompt = e;
    injectInstallButton(async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      document.getElementById('pwa-install-btn')?.remove();
    });
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('pwa-install-btn')?.remove();
  });

  // iOS Safari: no prompt API — show a one-time hint card
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
  }
  if (isIOS() && !isInstalled() && !localStorage.getItem('ft-install-hide')) {
    window.addEventListener('load', () => {
      const banner = document.createElement('div');
      banner.className = 'pwa-banner';
      banner.innerHTML = `
        <span>${t('pwa.iosInstall')}</span>
        <button type="button" class="pwa-banner-close" aria-label="${t('pwa.dismiss')}">✕</button>`;
      document.body.appendChild(banner);
      banner.querySelector('button').addEventListener('click', () => {
        localStorage.setItem('ft-install-hide', '1');
        banner.remove();
      });
    });
  }

  /* ---------------- per-city offline download (map page) ---------------- */

  if (!('caches' in window)) return;

  function absUrl(path) { return new URL(path, location.href).href; }

  async function isCached(dataPath) {
    return !!(await caches.match(absUrl(dataPath)));
  }

  async function removeCached(dataPath) {
    const url = absUrl(dataPath);
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      await cache.delete(url);
    }
  }

  document.addEventListener('ft-city', async e => {
    const { dataPath } = e.detail;
    const locateBtn = document.getElementById('locate-btn');
    if (!locateBtn) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'offline-btn';
    btn.className = 'locate-btn offline-btn';
    locateBtn.insertAdjacentElement('afterend', btn);

    async function refresh() {
      const cached = await isCached(dataPath);
      btn.classList.toggle('active', cached);
      btn.textContent = cached ? t('pwa.offlineReady') : t('pwa.download');
    }

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        if (await isCached(dataPath)) {
          await removeCached(dataPath);
        } else {
          btn.textContent = t('pwa.downloading');
          const res = await fetch(dataPath);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn('Offline download failed:', err);
      } finally {
        btn.disabled = false;
        refresh();
      }
    });

    refresh();
    document.addEventListener('ft-langchange', refresh);
  });
  /* ---------------- index page: per-city offline pre-download ---------------- */

  function decorateIndex() {
    const list = document.getElementById('country-list');
    if (!list) return;
    fetch('../data/cities.json').then(r => r.json()).then(index => {
      const byCode = {};
      for (const country of index.countries) {
        for (const c of country.cities) byCode[`${country.code}/${c.code}`] = `../${c.data}`;
      }

      async function addButtons() {
        for (const chip of list.querySelectorAll('.city-chip')) {
          if (chip.querySelector('.chip-offline')) continue;
          const m = chip.getAttribute('href').match(/city=([^&]+)/);
          if (!m || !byCode[m[1]]) continue;
          const dataPath = byCode[m[1]];
          const btn = document.createElement('span');
          btn.className = 'chip-offline';
          btn.setAttribute('role', 'button');
          btn.title = t('pwa.download');
          const cached = await isCached(dataPath);
          btn.textContent = cached ? '✓' : '⬇';
          btn.classList.toggle('active', cached);
          btn.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();
            if (btn.classList.contains('busy')) return;
            btn.classList.add('busy');
            try {
              if (await isCached(dataPath)) {
                await removeCached(dataPath);
              } else {
                btn.textContent = '…';
                const res = await fetch(dataPath);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
              }
            } catch (err) {
              console.warn('offline toggle failed:', err);
            }
            const done = await isCached(dataPath);
            btn.textContent = done ? '✓' : '⬇';
            btn.classList.toggle('active', done);
            btn.classList.remove('busy');
          });
          chip.appendChild(btn);
        }
      }

      // index re-renders on language change — re-decorate after each render
      new MutationObserver(addButtons).observe(list, { childList: true });
      addButtons();
    }).catch(err => console.warn('offline decorate failed:', err));
  }

  if (document.body.classList.contains('map-page')) {
    // map-page section above listens for ft-city; nothing else to do here
  } else {
    decorateIndex();
  }
})();
