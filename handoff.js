/* Final handoff to Freedx (Armenian page).
   The last section is tall with a sticky stage inside. The Freedx preview is laid out at the
   full stage size and only scaled (transform), so growing it never re-crops or reflows. Its
   size follows the scroll through a damped value, which keeps the motion smooth even with
   stepped mouse wheels. Once the preview covers the screen it holds; scrolling on to the end
   of the section opens Freedx in this tab. A scroll that slams straight into the end does not
   redirect by itself: the reader has to scroll down once more.
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
  var GROW = 0.72;          // share of the section's scroll spent growing; the rest holds full screen
  var SETTLE_MS = 400;      // the preview must cover the screen this long before the end can redirect
  var RADIUS = 28;

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }

  var manual = false, leaving = false, viewed = false;
  var armed = false;        // set only by a real downward scroll, so a restored position never redirects
  var lastY = window.scrollY;
  var target = 0, cur = 0, lastT = 0, raf = 0;
  var fullAt = 0;
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

  function go(how) {
    if (leaving || manual) return;
    leaving = true;
    track('handoff_redirect', { trigger: how });
    window.location.href = URL;
  }

  function maybeGo(how) {
    if (armed && progress() >= 0.995 && fullAt && Date.now() - fullAt >= SETTLE_MS) go(how);
  }

  function tick(t) {
    raf = 0;
    if (manual) return;
    var dt = lastT ? Math.min(64, t - lastT) : 16;
    lastT = t;
    cur += (target - cur) * (1 - Math.exp(-dt / 110));
    if (Math.abs(target - cur) < 0.0008) cur = target;
    paint();
    if (cur >= 1) { if (!fullAt) fullAt = Date.now(); } else fullAt = 0;
    if (cur !== target) raf = requestAnimationFrame(tick); else lastT = 0;
  }

  function update() {
    if (manual) return;
    var p = progress();
    target = Math.min(1, p / GROW);
    if (!viewed && p > 0) { viewed = true; track('handoff_view'); }
    if (!raf && cur !== target) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > lastY + 1) armed = true; else if (y < lastY - 1) armed = false;
    lastY = y;
    update();
    maybeGo('scroll');
  }, { passive: true });

  // At the very end the page cannot scroll further, so a downward wheel, swipe or key is the signal.
  function nudge() { if (progress() >= 0.995) { armed = true; maybeGo('gesture'); } }
  window.addEventListener('wheel', function (e) { if (e.deltaY > 0) nudge(); }, { passive: true });
  var ty0 = null;
  window.addEventListener('touchstart', function (e) { ty0 = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (ty0 !== null && ty0 - e.touches[0].clientY > 30) nudge(); }, { passive: true });
  window.addEventListener('keydown', function (e) { if (['ArrowDown', 'PageDown', 'End', ' '].indexOf(e.key) > -1) nudge(); });

  sec.querySelector('.handoff-stay').addEventListener('click', function () {
    manual = true;
    sec.classList.add('is-manual');
    [stick, shot, head, foot].forEach(function (el) { el.removeAttribute('style'); });
    track('handoff_stay');
  });

  window.addEventListener('resize', function () { if (manual) return; measure(); paint(); update(); });

  // Back button from Freedx: the page may come back from cache scrolled to the end.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false; armed = false; fullAt = 0;
    window.scrollTo(0, sec.offsetTop - window.innerHeight * 0.6);
  });

  measure();
  cur = target = Math.min(1, progress() / GROW);
  paint();
})();
