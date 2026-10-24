/* Bitcoin and Ethereum coins that turn into app QR codes (Armenian page).
   Each coin is drawn on its own canvas: a metal coin slowly turning and floating.
   Tap or click: the coin lights up, bursts into square particles, and the particles
   fly back together into a working QR code (Bitcoin → App Store, Ethereum → Google Play).
   Tap the QR to play it back into the coin.
   Wide screens (>= 1180px): the two coins float at the right edge from the myth 2
   heading until the closing section. Narrow screens: in the article after the myth 2
   heading, with a direct store button under each coin. */
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
  var COINS = [
    { id: 'btc', name: 'Bitcoin', store: 'appstore', storeName: 'App Store',
      url: 'https://apps.apple.com/am/app/freedx-buy-sell-crypto-app/id6747028945',
      pal: { hi: '#fff1c7', light: '#ffc44d', mid: '#f7931a', dark: '#b85f00', deep: '#6e3500', glow: 'rgba(247,147,26,.75)', edgeA: '#c87410', edgeB: '#8a4a00' } },
    { id: 'eth', name: 'Ethereum', store: 'googleplay', storeName: 'Google Play',
      url: 'https://play.google.com/store/apps/details?id=com.freedx.cexmobile&hl=en',
      pal: { hi: '#ffffff', light: '#d9defa', mid: '#9aa6dd', dark: '#5562a8', deep: '#2b3270', glow: 'rgba(129,140,248,.8)', edgeA: '#7480c4', edgeB: '#3b4488' } }
  ];
  var QUIET = 2;                 // modules of white margin around the code
  var DUR_IN = 1800, DUR_OUT = 1300;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DARK = [22, 21, 29];

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  /* ---------- markup ---------- */
  var html = '<p class="cc-hint">Սեղմեք մետաղադրամին՝ QR-ը տեսնելու համար</p><div class="cc-row">';
  COINS.forEach(function (c) {
    html += '<figure class="cc-item" data-coin="' + c.id + '">' +
      '<button class="cc-stage" type="button" aria-label="' + c.name + '. Սեղմեք՝ ' + c.storeName + '-ի QR կոդը տեսնելու համար"><canvas></canvas></button>' +
      '<figcaption><span class="cc-name">' + c.name + '</span><span class="cc-store">' + c.storeName + '</span></figcaption>' +
      '<a class="cc-btn" href="' + c.url + '" target="_blank" rel="noopener" data-store="' + c.store + '">Բացել ' + c.storeName + '</a>' +
      '</figure>';
  });
  root.innerHTML = html + '</div>';

  /* ---------- drawing the coin ---------- */
  function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(rx, .01), ry, 0, 0, Math.PI * 2); }

  function emblem(ctx, id, R, P) {
    // drawn in face coordinates, centered at 0,0, radius R
    if (id === 'btc') {
      ctx.save();
      ctx.rotate(-0.24);
      ctx.font = '800 ' + (R * 1.08) + 'px "Arial Black", "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var bars = function () {
        [-0.13, 0.07].forEach(function (bx) {
          ctx.fillRect(bx * R, -R * 0.66, R * 0.085, R * 0.2);
          ctx.fillRect(bx * R, R * 0.47, R * 0.085, R * 0.2);
        });
      };
      ctx.fillStyle = P.deep; ctx.translate(R * .03, R * .035); ctx.fillText('B', 0, R * .02); bars();
      ctx.translate(-R * .05, -R * .055); ctx.fillStyle = P.hi; ctx.fillText('B', 0, R * .02); bars();
      ctx.translate(R * .02, R * .02); ctx.fillStyle = '#fff7e6'; ctx.globalAlpha = .9; ctx.fillText('B', 0, R * .02); bars();
      ctx.restore();
    } else {
      var f = function (pts, col) { ctx.beginPath(); ctx.moveTo(pts[0] * R, pts[1] * R); for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * R, pts[i + 1] * R); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      ctx.save(); ctx.translate(R * .03, R * .035);
      f([0, -.66, -.4, .04, 0, .26, .4, .04], P.deep); f([-.4, .14, 0, .7, .4, .14, 0, .37], P.deep);
      ctx.restore();
      f([0, -.66, -.4, .04, 0, -.15], '#ffffff');
      f([0, -.66, .4, .04, 0, -.15], '#e3e7ff');
      f([-.4, .04, 0, -.15, 0, .26], '#c9d0f5');
      f([.4, .04, 0, -.15, 0, .26], '#aeb7ea');
      f([-.4, .14, 0, .7, 0, .37], '#f2f4ff');
      f([.4, .14, 0, .7, 0, .37], '#c3cbf2');
    }
  }

  function drawCoin(ctx, c, cx, cy, R, theta, scale, glow) {
    var P = c.pal;
    R *= scale;
    var s = Math.cos(theta), sn = Math.sin(theta);
    var rx = Math.abs(s) * R, T = R * 0.14;
    var fx = cx + sn * T / 2;

    // edge: stacked ellipses from the back face to the front face, with reeding
    var steps = Math.max(1, Math.ceil(Math.abs(sn) * T));
    var eg = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    eg.addColorStop(0, P.edgeA); eg.addColorStop(.5, P.edgeB); eg.addColorStop(1, P.deep);
    for (var i = 0; i <= steps; i++) {
      var x = cx - sn * T / 2 + sn * T * (i / steps);
      ellipse(ctx, x, cy, rx, R);
      ctx.fillStyle = (i % 2) ? eg : P.edgeB;
      ctx.fill();
    }

    // face
    ctx.save();
    if (glow > 0) { ctx.shadowColor = P.glow; ctx.shadowBlur = R * 0.9 * glow; }
    ellipse(ctx, fx, cy, rx, R);
    var g = ctx.createRadialGradient(fx - rx * 0.35, cy - R * 0.45, 0, fx, cy, R * 1.3);
    g.addColorStop(0, P.hi); g.addColorStop(.35, P.light); g.addColorStop(.7, P.mid); g.addColorStop(1, P.dark);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();

    // raised rim
    ctx.save();
    ctx.lineWidth = R * 0.075;
    ellipse(ctx, fx, cy, rx * 0.87, R * 0.87);
    var rg = ctx.createLinearGradient(fx - rx, cy - R, fx + rx, cy + R);
    rg.addColorStop(0, P.hi); rg.addColorStop(.5, P.dark); rg.addColorStop(1, P.light);
    ctx.strokeStyle = rg; ctx.stroke();
    ctx.lineWidth = R * 0.02; ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ellipse(ctx, fx, cy, rx * 0.81, R * 0.81); ctx.stroke();
    ctx.restore();

    // emblem, foreshortened with the turn (never mirrored)
    if (Math.abs(s) > 0.06) {
      ctx.save();
      ctx.translate(fx, cy); ctx.scale(Math.abs(s), 1);
      emblem(ctx, c.id, R * 0.78, P);
      ctx.restore();
    }

    // moving specular band
    ctx.save();
    ellipse(ctx, fx, cy, rx, R); ctx.clip();
    var k = (sn + 1) / 2, bx = fx - rx + 2 * rx * k;
    var sg = ctx.createLinearGradient(bx - R * 0.6, cy - R, bx + R * 0.6, cy + R);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,' + (0.38 + glow * 0.3) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(fx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
  }

  function drawShadow(ctx, cx, y, R, lift, alpha) {
    ctx.save();
    var w = R * (0.78 - lift * 0.12);
    var g = ctx.createRadialGradient(cx, y, 0, cx, y, w);
    g.addColorStop(0, 'rgba(30, 18, 90,' + (0.28 * alpha) + ')'); g.addColorStop(1, 'rgba(30, 18, 90, 0)');
    ctx.fillStyle = g; ctx.translate(cx, y); ctx.scale(1, 0.18); ctx.translate(-cx, -y);
    ctx.beginPath(); ctx.arc(cx, y, w, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------- one coin ---------- */
  function Coin(fig, c, idx) {
    this.fig = fig; this.c = c; this.idx = idx;
    this.canvas = fig.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.q = QR[c.store];
    this.state = 'coin';   // coin | toQR | qr | toCoin
    this.p = 0;            // 0 = coin, 1 = QR
    this.spin0 = idx * 1.7; // phase offset so the two coins never turn in sync
    this.thetaHold = 0;
    this.particles = null;
  }

  Coin.prototype.resize = function () {
    var css = this.fig.querySelector('.cc-stage').clientWidth;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.round(css * dpr); this.H = this.W;
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.R = this.W * 0.33;
    this.cx = this.W / 2; this.cy = this.H * 0.46;
    var cells = this.q.n + QUIET * 2;
    this.mod = Math.max(2, Math.floor(this.W * 0.86 / cells));
    this.plate = this.mod * cells;
    this.ox = Math.round((this.W - this.plate) / 2); this.oy = Math.round((this.H - this.plate) / 2);
    this.particles = null;
  };

  Coin.prototype.theta = function (t) { return this.spin0 + t * 0.00075; };     // about 8.4 s per turn
  Coin.prototype.float = function (t) { return Math.sin(t * 0.0013 + this.idx * 2.1); };

  // Particles: the face-on coin sampled on the QR module grid, each assigned a QR cell.
  Coin.prototype.build = function () {
    var off = document.createElement('canvas'); off.width = this.W; off.height = this.H;
    var o = off.getContext('2d');
    drawCoin(o, this.c, this.cx, this.cy, this.R, 0, 1.1, 0);
    var data = o.getImageData(0, 0, this.W, this.H).data;
    var m = this.mod, src = [];
    for (var y = m / 2; y < this.H; y += m) for (var x = m / 2; x < this.W; x += m) {
      var i = ((y | 0) * this.W + (x | 0)) * 4;
      if (data[i + 3] > 200) src.push([x - m / 2, y - m / 2, data[i], data[i + 1], data[i + 2]]);
    }
    var n = this.q.n, bits = this.q.bits, dark = [], light = [];
    for (var r = -QUIET; r < n + QUIET; r++) for (var col = -QUIET; col < n + QUIET; col++) {
      var on = r >= 0 && col >= 0 && r < n && col < n && bits.charAt(r * n + col) === '1';
      (on ? dark : light).push([this.ox + (col + QUIET) * m, this.oy + (r + QUIET) * m]);
    }
    // shuffle sources so every QR cell draws from a random spot on the coin
    for (var k = src.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var tmp = src[k]; src[k] = src[j]; src[j] = tmp; }
    for (k = light.length - 1; k > 0; k--) { j = Math.floor(Math.random() * (k + 1)); tmp = light[k]; light[k] = light[j]; light[j] = tmp; }
    var pc = this.ox + this.plate / 2, pcy = this.oy + this.plate / 2, maxD = this.plate * 0.71;
    var parts = [], self = this;
    function add(s, t, isDark) {
      var ang = Math.atan2(s[1] - self.cy, s[0] - self.cx) + (Math.random() - .5) * 0.9;
      var dist = self.R * (0.3 + Math.random() * 0.55);
      var d = Math.hypot(t[0] - pc, t[1] - pcy) / maxD;
      parts.push({ sx: s[0], sy: s[1], sc: [s[2], s[3], s[4]], tx: t[0], ty: t[1], dark: isDark,
        ex: s[0] + Math.cos(ang) * dist, ey: s[1] + Math.sin(ang) * dist,
        delay: Math.min(.45, d * 0.32 + Math.random() * 0.12) });
    }
    dark.forEach(function (t, i) { add(src[i % src.length], t, true); });
    for (k = dark.length; k < src.length && k - dark.length < light.length; k++) add(src[k], light[k - dark.length], false);
    this.particles = parts;
  };

  Coin.prototype.render = function (t) {
    var ctx = this.ctx, W = this.W, H = this.H, p = this.p;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var lift = this.float(t);
    var cy = this.cy + lift * this.H * 0.025;

    if (p <= 0.15) {
      // coin, idle or lighting up before the burst
      var e = easeOut(p / 0.15);
      var th = this.state === 'coin' ? this.theta(t) : this.state === 'toQR' ? this.thetaHold * (1 - e) : 0;
      drawShadow(ctx, this.cx, this.cy + this.R * 1.22, this.R, lift, 1 - e * .5);
      drawCoin(ctx, this.c, this.cx, cy + (this.cy - cy) * e, this.R, th, 1 + 0.1 * e, e);
      return;
    }
    if (!this.particles) this.build();
    var m = this.mod;

    // white plate grows in under the gathering particles
    var plateA = clamp((p - 0.55) / 0.35);
    if (plateA > 0) {
      ctx.save();
      ctx.globalAlpha = plateA;
      ctx.shadowColor = this.c.pal.glow; ctx.shadowBlur = m * 6 * (1 - clamp((p - 0.9) / 0.1) * 0.6);
      var pad = m * 0.6;
      roundRect(ctx, this.ox - pad, this.oy - pad, this.plate + 2 * pad, this.plate + 2 * pad, m * 2.2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.restore();
    }

    // flash at the moment of the burst
    var fl = 1 - Math.abs((p - 0.2) / 0.08);
    if (fl > 0) {
      var fg = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.R * 1.6);
      fg.addColorStop(0, 'rgba(255,255,255,' + (0.8 * fl) + ')'); fg.addColorStop(.4, this.c.pal.glow.replace(/[\d.]+\)$/, (0.5 * fl) + ')')); fg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
    }

    var pe = easeOut(clamp((p - 0.15) / 0.3));
    var pa = (p - 0.45) / 0.5;
    var parts = this.particles;
    for (var i = 0; i < parts.length; i++) {
      var o = parts[i];
      var q = easeInOut(clamp((pa - o.delay) / (1 - 0.45)));
      var bx = o.sx + (o.ex - o.sx) * pe, by = o.sy + (o.ey - o.sy) * pe;
      var x = bx + (o.tx - bx) * q, y = by + (o.ty - by) * q;
      var tc = o.dark ? DARK : [255, 255, 255];
      var r = Math.round(o.sc[0] + (tc[0] - o.sc[0]) * q), g = Math.round(o.sc[1] + (tc[1] - o.sc[1]) * q), b = Math.round(o.sc[2] + (tc[2] - o.sc[2]) * q);
      var sz = m * (0.8 + 0.2 * q);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      if (q >= 1) ctx.fillRect(o.tx, o.ty, m, m);
      else ctx.fillRect(x + (m - sz) / 2, y + (m - sz) / 2, sz, sz);
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
    if (coin.state === 'coin' || coin.state === 'toCoin') {
      if (coin.state === 'coin') coin.thetaHold = nearestFace(coin.theta(now));
      coin.state = 'toQR';
      coin.fig.classList.add('is-qr');
      coin.fig.querySelector('.cc-stage').setAttribute('aria-label', coin.c.storeName + '-ի QR կոդ։ Սեղմեք՝ մետաղադրամը վերադարձնելու համար');
      track('coin_to_qr', { coin: coin.c.id, store: coin.c.store });
    } else {
      coin.state = 'toCoin';
      coin.fig.classList.remove('is-qr');
      coin.fig.querySelector('.cc-stage').setAttribute('aria-label', coin.c.name + '. Սեղմեք՝ ' + coin.c.storeName + '-ի QR կոդը տեսնելու համար');
      track('coin_back', { coin: coin.c.id });
    }
    if (reduce) { coin.p = coin.state === 'toQR' ? 1 : 0; settle(coin, now); coin.render(now); }
    kick();
  }

  // the visible face closest to the current angle, so the coin turns front-on without a jump
  function nearestFace(th) { var tw = Math.PI * 2; th = ((th % tw) + tw) % tw; return th > Math.PI ? th - tw : th; }

  function settle(coin, now) {
    if (coin.state === 'toQR' && coin.p >= 1) { coin.p = 1; coin.state = 'qr'; }
    if (coin.state === 'toCoin' && coin.p <= 0) {
      coin.p = 0; coin.state = 'coin';
      coin.spin0 = -now * 0.00075; // carry on turning from the front face
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
      if (coin.state !== 'qr' || coin.drawnQR !== true) {
        coin.render(now);
        coin.drawnQR = coin.state === 'qr';
      }
      if (coin.state !== 'qr' && !(reduce && coin.state === 'coin')) busy = true;
    });
    if (busy && inView && isShown()) kick();
    else last = 0;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  function isShown() { return !root.classList.contains('is-side') || root.classList.contains('is-visible'); }

  function resizeAll() {
    coins.forEach(function (c) { c.resize(); c.drawnQR = false; if (c.state === 'qr') c.build(); });
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
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { coins.forEach(function (c) { c.particles = null; }); kick(); });
  place();
})();
