/* Final handoff to Freedx (Armenian page).
   The last section is tall with a sticky stage inside. The Freedx preview is laid out at the
   full stage size and only scaled (transform), so growing it never re-crops or reflows. Its
   size follows the scroll through a damped value, which keeps the motion smooth even with
   stepped mouse wheels. As soon as the reader scrolls the preview into view, the growth plays
   by itself to full screen and Freedx opens in this tab, with no further scrolling needed.
   The site is prefetched while the preview grows.
   "Չանցնել ավտոմատ" turns the automatic step off and shows a regular button instead. */
(function () {
  var sec = document.getElementById('handoff');
  if (!sec) return;
  var stick = sec.querySelector('.handoff-stick');
  var shot = sec.querySelector('.handoff-shot');
  var head = sec.querySelector('.handoff-head');
  var foot = sec.querySelector('.handoff-foot');
  var bar = sec.querySelector('.handoff-bar');
  var URL = sec.dataset.href;
  var VISIBLE = 0.55;       // share of the preview on screen that starts the automatic growth
  var AUTO_MS = 900;        // duration of that automatic growth to full screen
  var RADIUS = 28;

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }

  var manual = false, leaving = false, viewed = false;
  var armed = false;        // set only by a real downward scroll, so a restored position never redirects
  var lastY = window.scrollY;
  var target = 0, cur = 0, lastT = 0, raf = 0, auto = false;
  var W = 0, H = 0, s0 = 0.5, top0 = 0;

  function measure() {
    W = document.documentElement.clientWidth;
    // Stretch the stage to the window, whatever the article column width is.
    stick.style.marginLeft = stick.style.width = '';
    stick.style.marginLeft = -stick.getBoundingClientRect().left + 'px';
    stick.style.width = W + 'px';
    H = stick.clientHeight;
    var phone = W <= 640;
    top0 = head.offsetHeight + (phone ? 18 : 28);
    var room = (H - top0 - foot.offsetHeight - 12) / H;
    s0 = Math.min(phone ? 0.8 : Math.min(760, W * 0.62) / W, room);
  }

  function progress() {
    var r = sec.getBoundingClientRect();
    var run = sec.offsetHeight - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }

  function easeInOut(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  function paint() {
    var e = easeInOut(cur);
    var s = s0 + (1 - s0) * e;
    var ty = top0 * (1 - e);
    shot.style.transform = 'translate3d(0,' + ty.toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
    shot.style.borderRadius = (RADIUS * (1 - e) / s).toFixed(2) + 'px';
    shot.style.boxShadow = e >= 1 ? 'none' : '';
    var fade = Math.max(0, 1 - e * 5);
    head.style.opacity = foot.style.opacity = fade.toFixed(3);
    head.style.transform = 'translateY(' + (-e * 120).toFixed(1) + 'px)';
    foot.style.visibility = head.style.visibility = fade ? '' : 'hidden';
    bar.style.setProperty('--p', cur.toFixed(3));
  }

  // Warm up the Freedx page while the preview grows, so the redirect lands quickly.
  function prefetch() {
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = URL;
    document.head.appendChild(l);
  }

  function go(how) {
    if (leaving || manual) return;
    leaving = true;
    track('handoff_redirect', { trigger: how });
    window.location.href = URL;
  }

  // Finish the growth on its own, then open Freedx.
  function autoplay() {
    if (auto || leaving || manual) return;
    auto = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    var from = cur, dur = AUTO_MS * (1 - from), t0 = 0;
    track('handoff_auto');
    // Pin the stage to the window where it is now, then slide it to the top while the preview
    // grows, so scrolling on cannot carry it away mid-animation.
    var top0px = Math.max(0, stick.getBoundingClientRect().top);
    stick.style.marginLeft = '0';
    stick.style.top = top0px + 'px';
    sec.classList.add('is-auto');
    function step(t) {
      if (manual || !auto) return;
      if (!t0) t0 = t;
      var k = dur > 0 ? Math.min(1, (t - t0) / dur) : 1;
      cur = from + (1 - from) * k;
      stick.style.top = (top0px * (1 - easeInOut(k))).toFixed(1) + 'px';
      paint();
      if (k < 1) requestAnimationFrame(step);
      else setTimeout(function () { go('auto'); }, 120);
    }
    requestAnimationFrame(step);
  }

  function tick(t) {
    raf = 0;
    if (manual || auto) return;
    var dt = lastT ? Math.min(64, t - lastT) : 16;
    lastT = t;
    cur += (target - cur) * (1 - Math.exp(-dt / 80));
    if (Math.abs(target - cur) < 0.0008) cur = target;
    paint();
    if (cur !== target) raf = requestAnimationFrame(tick); else lastT = 0;
  }

  function update() {
    if (manual || auto) return;
    var p = progress();
    target = Math.min(1, p);
    var r = shot.getBoundingClientRect(), vh = window.innerHeight;
    var seen = r.height ? (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height : 0;
    if (!viewed && seen > 0) { viewed = true; track('handoff_view'); prefetch(); }
    if (armed && seen >= VISIBLE) { autoplay(); return; }
    if (!raf && cur !== target) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    // Only a scroll the reader is making counts, not a restored position or a jump link.
    if (y > lastY + 1) armed = Date.now() - inputAt < 2500; else if (y < lastY - 1) armed = false;
    lastY = y;
    update();
  }, { passive: true });

  var inputAt = 0;
  ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'].forEach(function (type) {
    window.addEventListener(type, function () { inputAt = Date.now(); }, { passive: true });
  });

  sec.querySelector('.handoff-stay').addEventListener('click', function () {
    manual = true; auto = false;
    sec.classList.add('is-manual');
    [stick, shot, head, foot].forEach(function (el) { el.removeAttribute('style'); });
    track('handoff_stay');
  });

  // The cue in the offer card glides down to the preview, which then plays on its own.
  var cue = document.querySelector('.offer-cue');
  if (cue) cue.addEventListener('click', function (e) {
    e.preventDefault();
    inputAt = Date.now();
    window.scrollTo({ top: sec.offsetTop - window.innerHeight * 0.2, behavior: 'smooth' });
  });

  window.addEventListener('resize', function () { if (manual) return; measure(); paint(); update(); });

  // Back button from Freedx: the page may come back from cache scrolled to the end.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false; armed = false; auto = false;
    sec.classList.remove('is-auto');
    stick.style.top = '';
    measure();
    window.scrollTo(0, sec.offsetTop - window.innerHeight * 0.6);
    cur = target = 0;
    paint();
  });

  measure();
  cur = target = Math.min(1, progress());
  paint();
})();
