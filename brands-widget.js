/* "What can you buy with crypto" widget for myth 2 (Armenian page).
   Desktop (wide screens): fixed to the right of the text column while myth 2 is being read.
   Narrow screens: in the page flow right after the myth 2 heading.
   Payment info is about gift cards bought with crypto (e.g. via Bitrefill), never direct acceptance. */
(function () {
  var root = document.getElementById('brand-widget');
  var myth2 = document.getElementById('myth-2');
  var myth3 = document.getElementById('myth-3');
  if (!root || !myth2 || !myth3) return;
  var heading = myth2.querySelector('h2');

  var GIFT = 'Վճարումը նվեր քարտով է (օր.՝ Bitrefill-ի միջոցով), ոչ թե ուղղակիորեն կրիպտոարժույթով։';
  var REGION = 'Հասանելիությունը կախված է երկրից։';
  function how(name, use) {
    return 'Կրիպտոարժույթով կարելի է ձեռք բերել ' + name + '-ի նվեր քարտ և օգտագործել այն ' + use + '՝ համապատասխան տարածաշրջանային պայմանների դեպքում։';
  }

  var CATEGORIES = [
    { id: 'shopping', title: 'Էլեկտրոնիկա և գնումներ', note: 'Տեխնիկա, հավելվածներ և առցանց գնումներ', icon: 'device',
      brands: [
        { id: 'apple', name: 'Apple', type: 'Տեխնիկա, հավելվածներ և ծառայություններ', how: how('Apple', 'App Store-ում և Apple-ի ծառայություններում') },
        { id: 'amazon', name: 'Amazon', type: 'Առցանց խանութ', how: how('Amazon', 'ապրանքներ գնելու համար') },
        { id: 'bestbuy', name: 'Best Buy', type: 'Էլեկտրոնիկայի խանութ', how: how('Best Buy', 'էլեկտրոնիկա գնելու համար'), region: 'Best Buy-ի նվեր քարտերը հիմնականում ԱՄՆ-ի համար են։', logo: false }
      ] },
    { id: 'travel', title: 'Ճամփորդություններ', note: 'Կացարան, հյուրանոց և երթևեկություն', icon: 'plane',
      brands: [
        { id: 'airbnb', name: 'Airbnb', type: 'Կացարանների ամրագրում', how: how('Airbnb', 'կացարան ամրագրելու համար') },
        { id: 'hotelscom', name: 'Hotels.com', type: 'Հյուրանոցների ամրագրում', how: how('Hotels.com', 'հյուրանոց ամրագրելու համար') },
        { id: 'uber', name: 'Uber', type: 'Տաքսի և սննդի առաքում', how: how('Uber', 'երթևեկելու կամ Uber Eats-ով սնունդ պատվիրելու համար') }
      ] },
    { id: 'sport', title: 'Սպորտ և հագուստ', note: 'Սպորտային հագուստ, կոշիկ և նորաձևություն', icon: 'shirt',
      brands: [
        { id: 'nike', name: 'Nike', type: 'Սպորտային հագուստ և կոշիկ', how: how('Nike', 'Nike-ի խանութներում և կայքում') },
        { id: 'adidas', name: 'Adidas', type: 'Սպորտային հագուստ և կոշիկ', how: how('Adidas', 'Adidas-ի խանութներում և կայքում') },
        { id: 'hm', name: 'H&M', type: 'Հագուստ և աքսեսուարներ', how: how('H&M', 'H&M-ի խանութներում և կայքում') }
      ] },
    { id: 'games', title: 'Խաղեր և ժամանց', note: 'Խաղեր, բաժանորդագրություններ և ֆիլմեր', icon: 'gamepad',
      brands: [
        { id: 'playstation', name: 'PlayStation Store', type: 'Տեսախաղեր և բաժանորդագրություններ', how: how('PlayStation Store', 'խաղեր և բաժանորդագրություններ գնելու համար') },
        { id: 'steam', name: 'Steam', type: 'Համակարգչային խաղեր', how: how('Steam', 'խաղեր գնելու համար') },
        { id: 'netflix', name: 'Netflix', type: 'Ֆիլմեր և սերիալներ', how: how('Netflix', 'բաժանորդագրության վճարման համար') }
      ] }
  ];

  var ICONS = {
    device: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M10 18.5h4"/>',
    plane: '<path d="M10.5 13.5 3 11l1.5-1.5 7.5 1L16.5 6a2 2 0 0 1 3 3l-4.5 4.5 1 7.5L14.5 22.5l-2.5-7.5-3 3V21L7 22.5 5.5 18.5 1.5 17 3 15.5h3z"/>',
    shirt: '<path d="M8 3 3 6l2 4 2.5-1V21h9V9l2.5 1 2-4-5-3a3.5 3.5 0 0 1-8 0z"/>',
    gamepad: '<path d="M7 7h10a4.5 4.5 0 0 1 4.4 5.4l-1 5A2.5 2.5 0 0 1 16 18.5L14.5 16h-5L8 18.5a2.5 2.5 0 0 1-4.4-1.1l-1-5A4.5 4.5 0 0 1 7 7z"/><path d="M8 10v3M6.5 11.5h3"/><circle cx="15.5" cy="11" r=".6"/><circle cx="17" cy="12.8" r=".6"/>'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var imgBase = root.getAttribute('data-img-base') || 'img/brands/';
  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }

  root.innerHTML =
    '<div class="bw-head"><p class="bw-title">Ի՞նչ կարելի է գնել կրիպտոյով</p><p class="bw-sub">Բացահայտեք ծանոթ բրենդները</p></div>' +
    '<div class="bw-stage" aria-live="polite">' +
      '<div class="bw-cat"><span class="bw-icon"></span><div><p class="bw-cat-title"></p><p class="bw-cat-note"></p></div></div>' +
      '<div class="bw-logos" role="list"></div>' +
      '<div class="bw-card" role="dialog" aria-modal="false" hidden>' +
        '<button class="bw-card-close" type="button" aria-label="Փակել">×</button>' +
        '<p class="bw-card-name"></p><p class="bw-card-type"></p><p class="bw-card-how"></p>' +
        '<p class="bw-card-gift"></p><p class="bw-card-region"></p>' +
        '<button class="bw-card-back" type="button">← Վերադառնալ բրենդներին</button>' +
      '</div>' +
    '</div>' +
    '<div class="bw-nav">' +
      '<button class="bw-arrow" type="button" data-dir="-1" aria-label="Նախորդ կատեգորիա">‹</button>' +
      '<span class="bw-count" aria-live="polite"></span>' +
      '<button class="bw-arrow" type="button" data-dir="1" aria-label="Հաջորդ կատեգորիա">›</button>' +
    '</div>' +
    '<p class="bw-foot">Կրիպտոարժույթով կարելի է ձեռք բերել նվեր քարտեր և օգտագործել դրանք տարբեր ծառայություններում։ Հասանելիությունը կախված է երկրից և տվյալ ծառայության պայմաններից։</p>';

  var $ = function (s) { return root.querySelector(s); };
  var stage = $('.bw-stage'), catBox = $('.bw-cat'), logos = $('.bw-logos'), card = $('.bw-card'), count = $('.bw-count');
  var index = 0, busy = false, lastLogo = null;

  function logoHTML(b) {
    return '<button class="bw-logo' + (b.logo === false ? ' is-text' : '') + '" type="button" role="listitem" data-brand="' + b.id + '" aria-label="' + esc(b.name) + '">' +
      (b.logo === false ? '' : '<img src="' + imgBase + b.id + '.svg" alt="' + esc(b.name) + '" loading="lazy" decoding="async">') +
      '<span class="bw-logo-name">' + esc(b.name) + '</span></button>';
  }
  function render() {
    var c = CATEGORIES[index];
    $('.bw-icon').innerHTML = icon(c.icon);
    $('.bw-cat-title').textContent = c.title;
    $('.bw-cat-note').textContent = c.note;
    logos.innerHTML = c.brands.map(logoHTML).join('');
    // Missing or broken logo file: show the brand name instead of a broken image.
    logos.querySelectorAll('img').forEach(function (img) {
      function fail() { img.parentNode.classList.add('is-text'); img.remove(); }
      if (img.complete && !img.naturalWidth) fail(); else img.addEventListener('error', fail);
    });
    count.textContent = (index + 1) + '/' + CATEGORIES.length;
  }

  function go(dir) {
    if (busy) return;
    closeCard(false);
    var next = (index + dir + CATEGORIES.length) % CATEGORIES.length;
    if (reduce) { index = next; render(); track('brands_category', { category: CATEGORIES[index].id }); return; }
    busy = true;
    stage.style.setProperty('--bw-shift', (dir > 0 ? -16 : 16) + 'px');
    stage.classList.add('is-leaving');
    setTimeout(function () {
      index = next; render();
      stage.classList.remove('is-leaving');
      stage.style.setProperty('--bw-shift', (dir > 0 ? 16 : -16) + 'px');
      stage.classList.add('is-entering');
      void stage.offsetWidth; // start the enter transition from the shifted state
      stage.classList.remove('is-entering');
      setTimeout(function () { busy = false; }, 300);
      track('brands_category', { category: CATEGORIES[index].id });
    }, 150);
  }

  function openCard(id, btn) {
    var b = CATEGORIES[index].brands.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    lastLogo = btn;
    $('.bw-card-name').textContent = b.name;
    $('.bw-card-type').textContent = b.type;
    $('.bw-card-how').textContent = b.how;
    $('.bw-card-gift').textContent = GIFT;
    $('.bw-card-region').textContent = b.region || REGION;
    card.hidden = false;
    root.classList.add('has-card');
    requestAnimationFrame(function () { card.classList.add('is-open'); });
    $('.bw-card-close').focus({ preventScroll: true });
    track('brands_logo_click', { brand: b.id, category: CATEGORIES[index].id });
  }
  function closeCard(refocus) {
    if (card.hidden) return;
    card.classList.remove('is-open');
    card.hidden = true;
    root.classList.remove('has-card');
    if (refocus && lastLogo && document.contains(lastLogo)) lastLogo.focus({ preventScroll: true });
  }

  root.addEventListener('click', function (e) {
    var a = e.target.closest('.bw-arrow');
    if (a) return go(+a.dataset.dir);
    var l = e.target.closest('.bw-logo');
    if (l) return openCard(l.dataset.brand, l);
    if (e.target.closest('.bw-card-close, .bw-card-back')) closeCard(true);
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCard(true); return; }
    if (!card.hidden) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });

  // Swipe between categories (horizontal only, vertical scrolling stays native).
  var sx = null, sy = 0;
  stage.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null || !card.hidden) { sx = null; return; }
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  render();

  // Placement: wide screens get a fixed side panel (moved to <body> so the article's
  // reveal transforms can't affect fixed positioning); narrow screens keep it in the flow.
  var wide = window.matchMedia('(min-width: 1240px)');
  var shown = false, seen = false;
  function place() {
    if (wide.matches) { if (root.parentNode !== document.body) document.body.appendChild(root); root.classList.add('is-side'); }
    else { if (root.previousElementSibling !== heading) heading.insertAdjacentElement('afterend', root); root.classList.remove('is-side'); }
    update();
  }
  function setShown(v) {
    if (v === shown) return;
    shown = v;
    root.classList.toggle('is-visible', v);
    if (root.classList.contains('is-side')) root.toggleAttribute('inert', !v);
    if (v && !seen) { seen = true; track('brands_widget_show', { layout: wide.matches ? 'side' : 'inline' }); }
    if (!v) closeCard(false);
  }
  function update() {
    var vh = window.innerHeight;
    if (wide.matches) {
      // Visible from the moment the myth 2 heading enters the screen until myth 3 takes over.
      var h = heading.getBoundingClientRect(), m3 = myth3.getBoundingClientRect();
      setShown(h.top < vh * 0.9 && m3.top > vh * 0.45);
    } else {
      root.removeAttribute('inert');
      var r = root.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) setShown(true);
    }
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }
  // Intersection Observer wakes the check when the trigger elements move in or out; scroll keeps it exact in between.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(onScroll, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    io.observe(heading); io.observe(myth3); io.observe(myth2);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', place);
  if (wide.addEventListener) wide.addEventListener('change', place);
  place();
})();
