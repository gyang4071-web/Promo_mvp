/* App download coins for the Armenian page (replaces the brands widget).
   Wide screens (>= 1180px): panel docked to the right edge from the myth 2 heading
   until the closing section; the coins spin in once and land on their QR side.
   Narrow screens: App Store / Google Play buttons right after the myth 2 heading. */
(function () {
  var root = document.getElementById('app-coins');
  var myth2 = document.getElementById('myth-2');
  var closing = document.querySelector('[data-block="conclusion"]');
  if (!root || !myth2 || !closing) return;
  var heading = myth2.querySelector('h2');

  var STORES = [
    { id: 'appstore', name: 'App Store', url: 'https://apps.apple.com/am/app/freedx-buy-sell-crypto-app/id6747028945',
      icon: '<svg class="ac-logo" viewBox="0 0 256 315" aria-hidden="true"><path d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262"/></svg>' },
    { id: 'googleplay', name: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.freedx.cexmobile&hl=en',
      icon: '<svg class="ac-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.6v16.8c0 .9 1 1.5 1.8 1l14-8.4c.8-.5.8-1.6 0-2L6.8 2.6C6 2.1 5 2.7 5 3.6z"/></svg>' }
  ];
  var base = root.dataset.imgBase || 'img/qr/';

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }

  var html = '<button class="ac-close" type="button" aria-label="Փակել">×</button>' +
    '<p class="ac-title">Freedx հավելվածը</p>';
  STORES.forEach(function (s) {
    html += '<a class="ac-coin-link" href="' + s.url + '" target="_blank" rel="noopener" data-store="' + s.id + '">' +
      '<span class="ac-coin"><span class="ac-coin-inner">' +
        '<span class="ac-face ac-front">' + s.icon + '</span>' +
        '<span class="ac-face ac-back"><span class="ac-qr"><img src="' + base + s.id + '.svg" alt="QR՝ ' + s.name + '" width="37" height="37"></span></span>' +
      '</span></span>' +
      '<span class="ac-coin-label">' + s.name + '</span></a>';
  });
  html += '<p class="ac-hint">Սքանավորեք QR-ը հեռախոսի տեսախցիկով</p><div class="ac-buttons">';
  STORES.forEach(function (s) {
    html += '<a class="ac-btn" href="' + s.url + '" target="_blank" rel="noopener" data-store="' + s.id + '">' +
      s.icon.replace('class="ac-logo" ', '') + s.name + '</a>';
  });
  html += '</div>';
  root.innerHTML = html;

  var wide = window.matchMedia('(min-width: 1180px)');
  var closed = false, spun = false, seen = false;

  function place() {
    if (wide.matches) { if (root.parentNode !== document.body) document.body.appendChild(root); root.classList.add('is-side'); }
    else { if (root.previousElementSibling !== heading) heading.insertAdjacentElement('afterend', root); root.classList.remove('is-side'); }
    update();
  }

  function setVisible(v) {
    root.classList.toggle('is-visible', v);
    if (root.classList.contains('is-side')) root.toggleAttribute('inert', !v);
    if (v && !seen) { seen = true; track('app_coins_view', { layout: root.classList.contains('is-side') ? 'qr' : 'buttons' }); }
    if (v && !spun && root.classList.contains('is-side')) { spun = true; root.classList.add('do-spin'); }
  }

  function update() {
    if (!root.classList.contains('is-side')) { root.removeAttribute('inert'); setVisible(true); return; }
    if (closed) { setVisible(false); return; }
    var vh = window.innerHeight;
    var h = heading.getBoundingClientRect(), c = closing.getBoundingClientRect();
    // from the moment the myth 2 heading reaches the middle of the screen until the closing section takes over
    setVisible(h.top < vh * 0.6 && c.top > vh * 0.45);
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('.ac-close')) { closed = true; update(); track('app_coins_close'); return; }
    var a = e.target.closest('[data-store]');
    if (a) track('app_store_click', { store: a.dataset.store, layout: root.classList.contains('is-side') ? 'qr' : 'buttons' });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  if (wide.addEventListener) wide.addEventListener('change', place); else wide.addListener(place);
  place();
})();
