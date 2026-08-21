/* FindToilet — language switcher dropdown (shared component).
 * Requires i18n.js loaded first and #lang-btn / #lang-menu in the page.
 * Dispatches 'ft-langchange' on document after a switch; pages decide how to
 * re-render (index re-renders in place, map reloads).
 */
(function () {
  const btn = document.getElementById('lang-btn');
  const menu = document.getElementById('lang-menu');
  if (!btn || !menu) return;

  for (const l of FT_LANGS) {
    const opt = document.createElement('button');
    opt.className = 'lang-option';
    opt.setAttribute('role', 'menuitem');
    opt.textContent = l.label;
    opt.dataset.lang = l.code;
    opt.addEventListener('click', () => {
      setLang(l.code);
      closeMenu();
      document.dispatchEvent(new CustomEvent('ft-langchange'));
    });
    menu.appendChild(opt);
  }

  function syncActive() {
    menu.querySelectorAll('.lang-option').forEach(o => {
      o.classList.toggle('active', o.dataset.lang === getLang());
    });
  }
  function closeMenu() {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    syncActive();
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang-switcher')) closeMenu();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();
