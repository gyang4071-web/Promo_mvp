/* Final handoff to Freedx (Armenian page).
   The last section is tall with a sticky stage inside. Scrolling through the first part grows
   the Freedx preview from a centred card to the full window width, dropping its rounded
   corners. It then holds at full width; only a new downward scroll that starts after that
   point opens Freedx in this tab, so the scroll that grew the preview never redirects.
   "Չանցնել ավտոմատ" turns the automatic step off and shows a regular button instead. */
(function () {
  var sec = document.getElementById('handoff');
  if (!sec) return;
  var stick = sec.querySelector('.handoff-stick');
  var shot = sec.querySelector('.handoff-shot');
  var bar = sec.querySelector('.handoff-bar');
  var URL = sec.dataset.href;
  var GROW = 0.7;           // share of the section's scroll spent growing; the rest holds at full width
  var HOLD_MS = 700;        // a new gesture must start at least this long after full width is reached

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, p || {}); }

  var manual = false, leaving = false, viewed = false;
  var lastY = window.scrollY, down = false;
  var fullAt = 0;           // when the preview last reached full width, 0 while it is smaller
  var gestureAt = 0;        // when the latest wheel / touch / key gesture started
  var inputAt = 0;          // the latest input event of any kind
  var lastWheel = 0;
  var startW = 0, ratio = 1, capH = 0, vw = 0;

  var curtain = document.createElement('div');
  curtain.className = 'handoff-curtain';
  var img = shot.querySelector('img');
  curtain.style.backgroundImage = 'url("' + img.getAttribute('src') + '")';
  document.body.appendChild(curtain);

  function measure() {
    vw = document.documentElement.clientWidth;
    var phone = vw <= 640;
    // Stretch the stage to the window, whatever the article column width is.
    stick.style.marginLeft = stick.style.width = '';
    var left = stick.getBoundingClientRect().left;
    stick.style.marginLeft = -left + 'px';
    stick.style.width = vw + 'px';
    startW = phone ? vw * 0.78 : Math.min(640, vw * 0.7);
    ratio = phone ? 4 / 5 : 1903 / 908;
    capH = window.innerHeight * (phone ? 0.56 : 0.64);
  }

  function progress() {
    var r = sec.getBoundingClientRect();
    var run = sec.offsetHeight - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function go(how) {
    if (leaving || manual) return;
    leaving = true;
    track('handoff_redirect', { trigger: how });
    curtain.classList.add('is-on');
    setTimeout(function () { window.location.href = URL; }, 380);
  }

  function ready() { return fullAt && progress() >= 0.97 && down; }

  function update() {
    if (manual) return;
    var p = progress();
    var g = ease(Math.min(1, p / GROW));
    var w = startW + (vw - startW) * g;
    shot.style.width = w.toFixed(1) + 'px';
    shot.style.height = Math.min(w / ratio, capH).toFixed(1) + 'px';
    shot.style.aspectRatio = 'auto';
    shot.style.borderRadius = (22 * (1 - g)).toFixed(2) + 'px';
    shot.style.setProperty('--g', g.toFixed(3));
    bar.style.setProperty('--p', g.toFixed(3));
    if (!viewed && p > 0) { viewed = true; track('handoff_view'); }

    var now = Date.now();
    if (g >= 1) { if (!fullAt) fullAt = now; } else fullAt = 0;
    if (!ready()) return;
    // A gesture that began after the hold, or a scrollbar drag with no gesture events at all.
    if (gestureAt >= fullAt + HOLD_MS || (now - inputAt > 1500 && now - fullAt > 1500)) go('scroll');
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > lastY + 1) down = true; else if (y < lastY - 1) down = false;
    lastY = y;
    requestAnimationFrame(update);
  }, { passive: true });

  // At the very bottom the page cannot scroll further, so the gesture itself is the signal.
  function gesture(isDown) {
    var now = Date.now();
    inputAt = now;
    if (!isDown) return;
    down = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('wheel', function (e) {
    var now = Date.now();
    if (now - lastWheel > 300) gestureAt = now;   // a fresh wheel / trackpad gesture, not its momentum
    lastWheel = now;
    if (e.deltaY < 0) down = false;
    gesture(e.deltaY > 0);
  }, { passive: true });
  var ty = null;
  window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; gestureAt = inputAt = Date.now(); }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (ty !== null) gesture(ty - e.touches[0].clientY > 30); }, { passive: true });
  window.addEventListener('keydown', function (e) {
    var isDown = ['ArrowDown', 'PageDown', 'End', ' '].indexOf(e.key) > -1;
    if (isDown && !e.repeat) gestureAt = Date.now();
    gesture(isDown);
  });

  sec.querySelector('.handoff-stay').addEventListener('click', function () {
    manual = true;
    sec.classList.add('is-manual');
    shot.removeAttribute('style');
    stick.removeAttribute('style');
    track('handoff_stay');
  });

  window.addEventListener('resize', function () { measure(); update(); });

  // Back button from Freedx: the page may come back from cache scrolled to the end.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false; down = false; fullAt = 0; gestureAt = 0;
    curtain.classList.remove('is-on');
    window.scrollTo(0, sec.offsetTop - window.innerHeight * 0.6);
  });

  measure();
  update();
})();
