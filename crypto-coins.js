/* Bitcoin and Ethereum coins that turn into app QR codes (Armenian page).
   The coins are rendered images (img/coins) drawn on a canvas each: they turn slowly
   back and forth, float, and catch a moving highlight.
   Tap or click: the coin lights up, bursts into square particles taken from its own pixels,
   and the particles gather into a bare violet QR code, with no card or frame
   (Bitcoin → App Store, Ethereum → Google Play). A small store logo appears under the code.
   Tap the code to play it back into the coin.
   Wide screens (>= 1180px): the coins float at the right edge from the myth 2 heading
   until the closing section. Narrow screens: in the article after the myth 2 heading,
   with a direct store button under each coin. */
(function () {
  var root = document.getElementById('crypto-coins');
  var myth2 = document.getElementById('myth-2');
  var closing = document.querySelector('[data-block="conclusion"]');
  if (!root || !myth2 || !closing || !window.HTMLCanvasElement) return;
  var heading = myth2.querySelector('h2');

  var QR = {
    appstore: { n: 37, bits: '1111111001101100001001011011001111111100000101101110001100111110110100000110111010001100101001000010101010111011011101001010001101000000010101011101101110101101010000110011001100101110110000010001100011101111111110010000011111111010101010101010101010101111111000000000110101001111101010100000000010101010000100001010011001101000100101010100101110101111100100010111000101101011101110101110000100100000101011100110101001010101101011101001000010101000101100011111010011011101011000011101111010010010010101100110010100001110011111111101100100100001000101001110000010111010001100001101101001010010101111111111101100001011011010110101001110101001011010001110001100110001011000011011100110001110101000101011111011010000010010101001110011101010001001001110110001101111010011101110000000001100101000110010010100100101101011111011100111000000101100010011010011111010100010000010110100111101000100000011001010110001101000010111011101011011011001110100110110100001011100101110011110101110111000001011001011110110110100100001000111101010101010110000101110101100010101001100110011111101100000000111000001000111011011000110111111111000010010010000100001101011011100000100001110110001110110110001100110111010111011000001101101101111110011011101001011111010111100110100111010101110101001010001111010011011001001110000010000100110100110011101101100101111111010011010010111101101111001011' },
    googleplay: { n: 37, bits: '1111111010101011000110010011101111111100000100100001011110100100010100000110111010011111010110010010101010111011011101011100010000010011111101011101101110101000111011100111011110101110110000010100101000101100001001010000011111111010101010101010101010101111111000000001101111110000110101000000000010001011101001011001111110010111110011001110010101100011100011101110011010011011110101110100110101111111001110000110100100001111111111110100101011101010001010011110110001101001011001111001101011101011110100101101110001100001010111001001111100010110010101111000100110001010111011001111000011110100000000111110001100110101100001110110000101101110111101001111100110000111101011001111101110111010010011101010100110101011000000001000101100111011011010111010011011110101011110010111001001001000111111001111001110011100110000111100110000101100101101101110011110000000101110010111000010010100001101011101101011101011100111111001111101110111110001111000000110001011110011000000011011110111010111001110111101000000000000010101001111111110011000110110111111110001000001001111101011111010000000000111101011000000100101000100101111111010110111010011011110101010010100000100100001111111100001110001110110111010110001100010111010001111111011011101000111110100110010011011101101101110100000000011100101011100100000010000010001100100101110000010000101101111111010101101010011001001011100111' }
  };
  var LOGO = {
    appstore: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cc-as" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fc8ff"/><stop offset="1" stop-color="#0a64f0"/></linearGradient></defs><rect width="24" height="24" rx="5.6" fill="url(#cc-as)"/><g stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M8.3 16.8l5-8.9"/><path d="M10.7 7.9l5 8.9"/><path d="M6.6 14.3h10.8"/></g></svg>',
    googleplay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.3 13.4 12l-9.8 9.7c-.3-.3-.4-.7-.4-1.2V3.5c0-.5.1-.9.4-1.2z" fill="#2196f3"/><path d="M3.6 2.3 13.4 12l3.1-3.1L5.2 2.4c-.6-.3-1.2-.3-1.6-.1z" fill="#00c853"/><path d="M3.6 21.7 13.4 12l3.1 3.1-11.3 6.5c-.6.3-1.2.3-1.6.1z" fill="#ff3d00"/><path d="m16.5 8.9-3.1 3.1 3.1 3.1 3.5-2c.9-.5.9-1.7 0-2.2z" fill="#ffc400"/></svg>'
  };
  var COINS = [
    { id: 'btc', name: 'Bitcoin', img: 'img/coins/btc.webp', store: 'appstore', storeName: 'App Store',
      url: 'https://apps.apple.com/am/app/freedx-buy-sell-crypto-app/id6747028945' },
    { id: 'eth', name: 'Ethereum', img: 'img/coins/eth.webp', store: 'googleplay', storeName: 'Google Play',
      url: 'https://play.google.com/store/apps/details?id=com.freedx.cexmobile&hl=en' }
  ];
  var QUIET = 2;
  var DUR_IN = 1800, DUR_OUT = 1300;
  var GLOW = 'rgba(168, 85, 247, .7)';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  // QR ink follows the theme: deep violet on light pages, light violet on dark ones
  function ink() {
    var v = getComputedStyle(root).getPropertyValue('--cc-ink').trim() || '#6b21a8';
    var m = v.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [107, 33, 168];
  }

  /* ---------- markup ---------- */
  var html = '<p class="cc-hint">Սեղմեք մետաղադրամին</p><div class="cc-row">';
  COINS.forEach(function (c) {
    html += '<figure class="cc-item" data-coin="' + c.id + '">' +
      '<button class="cc-stage" type="button" aria-label="' + c.name + '. Սեղմեք՝ ' + c.storeName + '-ի QR կոդը տեսնելու համար"><canvas></canvas></button>' +
      '<figcaption class="cc-logo" title="' + c.storeName + '">' + LOGO[c.store] + '</figcaption>' +
      '<a class="cc-btn" href="' + c.url + '" target="_blank" rel="noopener" data-store="' + c.store + '">' + LOGO[c.store] + '<span>' + c.storeName + '</span></a>' +
      '</figure>';
  });
  root.innerHTML = html + '</div>';
  // the inline SVG gradient id must be unique per copy
  root.querySelectorAll('svg').forEach(function (s, i) {
    var g = s.querySelector('linearGradient'); if (!g) return;
    g.id = 'cc-as-' + i; s.querySelector('rect').setAttribute('fill', 'url(#cc-as-' + i + ')');
  });

  /* ---------- one coin ---------- */
  function Coin(fig, c, idx) {
    this.fig = fig; this.c = c; this.idx = idx;
    this.canvas = fig.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.q = QR[c.store];
    this.state = 'coin';   // coin | toQR | qr | toCoin
    this.p = 0;            // 0 = coin, 1 = QR
    this.t0 = idx * 2600;  // phase offset so the coins never move in sync
    this.particles = null;
    this.img = new Image();
    this.img.decoding = 'async';
    var self = this;
    this.img.onload = function () { self.ready = true; self.particles = null; kick(); };
    this.img.src = c.img;
    this.off = document.createElement('canvas');
  }

  Coin.prototype.resize = function () {
    var css = this.fig.querySelector('.cc-stage').clientWidth;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(40, Math.round(css * dpr)); this.H = this.W;
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.cx = this.W / 2; this.cy = this.H * 0.47;
    this.ch = this.H * 0.7;                 // coin height
    var cells = this.q.n + QUIET * 2;
    this.mod = Math.max(2, Math.floor(this.W * 0.9 / cells));
    this.plate = this.mod * cells;
    this.ox = Math.round((this.W - this.plate) / 2); this.oy = Math.round((this.H - this.plate) / 2);
    this.particles = null;
  };

  // slow turn: the coin narrows and widens as if rotating, with a highlight sweeping across
  Coin.prototype.pose = function (t) {
    var a = (t + this.t0) * 0.00055;
    return { turn: Math.cos(a), sheen: (Math.sin(a) + 1) / 2, lift: Math.sin((t + this.t0) * 0.0012), tilt: Math.sin(a * 0.7) * 0.035 };
  };

  // draw the coin with its highlight into the offscreen canvas at scale sx (horizontal) and s
  Coin.prototype.paint = function (ctx, cx, cy, sx, s, sheen, glow, tilt) {
    var img = this.img, h = this.ch * s, w = h * img.naturalWidth / img.naturalHeight;
    var o = this.off, oc;
    if (o.width !== Math.ceil(w) || o.height !== Math.ceil(h)) { o.width = Math.ceil(w); o.height = Math.ceil(h); }
    oc = o.getContext('2d');
    oc.globalCompositeOperation = 'source-over';
    oc.clearRect(0, 0, o.width, o.height);
    oc.drawImage(img, 0, 0, o.width, o.height);
    oc.globalCompositeOperation = 'source-atop';
    var bx = -o.width * 0.4 + o.width * 1.8 * sheen;
    var g = oc.createLinearGradient(bx - o.width * 0.35, 0, bx + o.width * 0.35, o.height);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,236,255,' + (0.28 + glow * 0.25) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
    oc.fillStyle = g; oc.fillRect(0, 0, o.width, o.height);

    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(tilt || 0); ctx.scale(sx, 1);
    if (glow > 0) { ctx.shadowColor = GLOW; ctx.shadowBlur = this.ch * 0.35 * glow; }
    ctx.drawImage(o, -o.width / 2, -o.height / 2);
    ctx.restore();
  };

  Coin.prototype.shadow = function (ctx, lift, alpha) {
    var y = this.cy + this.ch * 0.6, w = this.ch * (0.42 - lift * 0.04);
    ctx.save();
    var g = ctx.createRadialGradient(this.cx, y, 0, this.cx, y, w);
    g.addColorStop(0, 'rgba(76, 29, 149,' + (0.22 * alpha) + ')'); g.addColorStop(1, 'rgba(76, 29, 149, 0)');
    ctx.translate(this.cx, y); ctx.scale(1, 0.16); ctx.translate(-this.cx, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.cx, y, w, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  // Particles: the front-on coin sampled on the QR module grid; each dark QR cell gets one.
  Coin.prototype.build = function () {
    var tmp = document.createElement('canvas'); tmp.width = this.W; tmp.height = this.H;
    var t = tmp.getContext('2d');
    this.paint(t, this.cx, this.cy, 1, 1.08, 0.5, 0, 0);
    var data = t.getImageData(0, 0, this.W, this.H).data;
    var m = this.mod, src = [];
    for (var y = m / 2; y < this.H; y += m) for (var x = m / 2; x < this.W; x += m) {
      var i = ((y | 0) * this.W + (x | 0)) * 4;
      if (data[i + 3] > 160) src.push([x - m / 2, y - m / 2, data[i], data[i + 1], data[i + 2]]);
    }
    if (!src.length) return;
    var n = this.q.n, bits = this.q.bits, dark = [];
    for (var r = 0; r < n; r++) for (var col = 0; col < n; col++)
      if (bits.charAt(r * n + col) === '1') dark.push([this.ox + (col + QUIET) * m, this.oy + (r + QUIET) * m]);
    for (var k = src.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var s = src[k]; src[k] = src[j]; src[j] = s; }
    var pc = this.ox + this.plate / 2, pcy = this.oy + this.plate / 2, maxD = this.plate * 0.71, self = this, parts = [];
    function add(s, tgt) {
      var ang = Math.atan2(s[1] - self.cy, s[0] - self.cx) + (Math.random() - .5) * 0.9;
      var dist = self.ch * (0.18 + Math.random() * 0.32);
      var d = tgt ? Math.hypot(tgt[0] - pc, tgt[1] - pcy) / maxD : Math.random();
      parts.push({ sx: s[0], sy: s[1], sc: [s[2], s[3], s[4]], tx: tgt ? tgt[0] : 0, ty: tgt ? tgt[1] : 0, keep: !!tgt,
        ex: s[0] + Math.cos(ang) * dist, ey: s[1] + Math.sin(ang) * dist,
        delay: Math.min(.45, d * 0.32 + Math.random() * 0.12) });
    }
    dark.forEach(function (tgt, i) { add(src[i % src.length], tgt); });
    for (k = dark.length; k < src.length; k++) add(src[k], null);   // leftovers drift off and fade
    this.particles = parts;
  };

  Coin.prototype.render = function (t) {
    var ctx = this.ctx, p = this.p;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    if (!this.ready) return;
    var pose = this.pose(t);
    var cyFloat = this.cy + pose.lift * this.H * 0.022;

    if (p <= 0.15) {
      var e = easeOut(p / 0.15);
      var turn = this.state === 'coin' ? pose.turn : (this.state === 'toQR' ? this.turnHold : 1);
      var sx = 0.78 + 0.22 * Math.abs(turn);
      if (this.state !== 'coin') sx = sx + (1 - sx) * e;
      this.shadow(ctx, pose.lift, 1 - e * .6);
      this.paint(ctx, this.cx, cyFloat + (this.cy - cyFloat) * e, sx, 1 + 0.08 * e, this.state === 'coin' ? pose.sheen : 0.5, e, this.state === 'coin' ? pose.tilt : 0);
      return;
    }
    if (!this.particles) this.build();
    if (!this.particles) return;
    var m = this.mod, INK = this.ink || (this.ink = ink());

    // soft violet bloom at the moment of the burst (gone well before the code forms)
    var fl = 1 - Math.abs((p - 0.2) / 0.1);
    if (fl > 0) {
      var fg = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.ch * 0.8);
      fg.addColorStop(0, 'rgba(216, 180, 254,' + (0.55 * fl) + ')'); fg.addColorStop(1, 'rgba(216, 180, 254, 0)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, this.W, this.H);
    }

    var pe = easeOut(clamp((p - 0.15) / 0.3));
    var pa = (p - 0.45) / 0.5;
    var parts = this.particles;
    for (var i = 0; i < parts.length; i++) {
      var o = parts[i];
      var q = easeInOut(clamp((pa - o.delay) / (1 - 0.45)));
      var bx = o.sx + (o.ex - o.sx) * pe, by = o.sy + (o.ey - o.sy) * pe;
      if (!o.keep) {
        // leftovers keep drifting out and fade away
        var fa = 1 - clamp((p - 0.3) / 0.35);
        if (fa <= 0) continue;
        ctx.globalAlpha = fa;
        ctx.fillStyle = 'rgb(' + o.sc[0] + ',' + o.sc[1] + ',' + o.sc[2] + ')';
        var dz = m * 0.7 * fa;
        ctx.fillRect(bx + (o.ex - o.sx) * 0.4 * (1 - fa), by + (o.ey - o.sy) * 0.4 * (1 - fa), dz, dz);
        ctx.globalAlpha = 1;
        continue;
      }
      if (q >= 1) { ctx.fillStyle = 'rgb(' + INK[0] + ',' + INK[1] + ',' + INK[2] + ')'; ctx.fillRect(o.tx, o.ty, m, m); continue; }
      var x = bx + (o.tx - bx) * q, y = by + (o.ty - by) * q;
      var r = Math.round(o.sc[0] + (INK[0] - o.sc[0]) * q), g = Math.round(o.sc[1] + (INK[1] - o.sc[1]) * q), b = Math.round(o.sc[2] + (INK[2] - o.sc[2]) * q);
      var sz = m * (0.75 + 0.25 * q);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(x + (m - sz) / 2, y + (m - sz) / 2, sz, sz);
    }
  };

  /* ---------- page wiring ---------- */
  var coins = [];
  root.querySelectorAll('.cc-item').forEach(function (fig, i) {
    var c = COINS.filter(function (x) { return x.id === fig.dataset.coin; })[0];
    var coin = new Coin(fig, c, i);
    coins.push(coin);
    fig.querySelector('.cc-stage').addEventListener('click', function () { toggle(coin); });
  });

  function toggle(coin) {
    var now = performance.now();
    var stage = coin.fig.querySelector('.cc-stage');
    if (coin.state === 'coin' || coin.state === 'toCoin') {
      if (coin.state === 'coin') coin.turnHold = coin.pose(now).turn;
      coin.state = 'toQR';
      coin.fig.classList.add('is-qr');
      stage.setAttribute('aria-label', coin.c.storeName + '-ի QR կոդ։ Սեղմեք՝ մետաղադրամը վերադարձնելու համար');
      track('coin_to_qr', { coin: coin.c.id, store: coin.c.store });
    } else {
      coin.state = 'toCoin';
      coin.fig.classList.remove('is-qr');
      stage.setAttribute('aria-label', coin.c.name + '. Սեղմեք՝ ' + coin.c.storeName + '-ի QR կոդը տեսնելու համար');
      track('coin_back', { coin: coin.c.id });
    }
    coin.drawnQR = false;
    if (reduce) { coin.p = coin.state === 'toQR' ? 1 : 0; settle(coin, now); coin.render(now); }
    kick();
  }

  function settle(coin, now) {
    if (coin.state === 'toQR' && coin.p >= 1) { coin.p = 1; coin.state = 'qr'; }
    if (coin.state === 'toCoin' && coin.p <= 0) {
      coin.p = 0; coin.state = 'coin';
      coin.t0 = -now;   // resume the slow turn from front-on
    }
  }

  var running = false, last = 0, inView = true;
  function frame(now) {
    running = false;
    var dt = last ? Math.min(now - last, 50) : 16; last = now;
    var busy = false;
    coins.forEach(function (coin) {
      if (coin.state === 'toQR') coin.p = Math.min(1, coin.p + dt / DUR_IN);
      else if (coin.state === 'toCoin') coin.p = Math.max(0, coin.p - dt / DUR_OUT);
      settle(coin, now);
      if (coin.state !== 'qr' || !coin.drawnQR) {
        coin.render(now);
        coin.drawnQR = coin.state === 'qr' && !!coin.particles;
      }
      if (coin.state !== 'qr' && !(reduce && coin.state === 'coin')) busy = true;
    });
    if (busy && inView && isShown()) kick();
    else last = 0;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function isShown() { return !root.classList.contains('is-side') || root.classList.contains('is-visible'); }

  function resizeAll() {
    coins.forEach(function (c) { c.resize(); c.drawnQR = false; c.ink = null; });
    var now = performance.now(); coins.forEach(function (c) { c.render(now); });
    kick();
  }

  /* placement */
  var wide = window.matchMedia('(min-width: 1180px)');
  var seen = false;
  function place() {
    if (wide.matches) { if (root.parentNode !== document.body) document.body.appendChild(root); root.classList.add('is-side'); }
    else { if (root.previousElementSibling !== heading) heading.insertAdjacentElement('afterend', root); root.classList.remove('is-side'); }
    resizeAll(); update();
  }
  function update() {
    var vis = true;
    if (root.classList.contains('is-side')) {
      var vh = window.innerHeight, h = heading.getBoundingClientRect(), c = closing.getBoundingClientRect();
      vis = h.top < vh * 0.6 && c.top > vh * 0.45;
      root.toggleAttribute('inert', !vis);
    } else root.removeAttribute('inert');
    var was = root.classList.contains('is-visible');
    root.classList.toggle('is-visible', vis);
    if (vis && !was) kick();
    if (vis && !seen && inView) { seen = true; track('coins_view', { layout: root.classList.contains('is-side') ? 'side' : 'inline' }); }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) { kick(); update(); } }).observe(root);
  }
  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-store]');
    if (a) track('app_store_click', { store: a.dataset.store, layout: root.classList.contains('is-side') ? 'side' : 'inline' });
  });
  var ticking = false;
  window.addEventListener('scroll', function () { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }, { passive: true });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(place, 120); });
  if (wide.addEventListener) wide.addEventListener('change', place); else wide.addListener(place);
  if (window.matchMedia) {
    var dm = matchMedia('(prefers-color-scheme: dark)');
    var re = function () { coins.forEach(function (c) { c.ink = null; c.drawnQR = false; }); kick(); };
    if (dm.addEventListener) dm.addEventListener('change', re);
  }
  place();
})();
