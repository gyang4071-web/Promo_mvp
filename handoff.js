/* Final handoff to Freedx (Armenian page).
   The last section is tall with a sticky screen inside. Scrolling through it grows the
   Freedx preview and fills the bar; scrolling down past the end opens Freedx in this tab.
   "Չանցնել ավտոմատ" turns the automatic step off and shows a regular button instead.
   The two wordings of the hint are split 50/50 per visitor and reported as text_variant. */
(function () {
  var sec = document.getElementById('handoff');
  if (!sec) return;
  var shot = sec.querySelector('.handoff-shot');
  var bar = sec.querySelector('.handoff-bar');
  var text = sec.querySelector('.handoff-text');
  var URL = sec.dataset.href;
  var TEXTS = {
    a: 'Շարունակելով ոլորել ներքև՝ դուք կանցնեք Freedx-ի էջ',
    b: 'Ոլորեք ներքև՝ Freedx-ի էջ անցնելու համար'
  };
  var variant;
  try { variant = localStorage.getItem('fx_handoff_v'); } catch (e) {}
  if (variant !== 'a' && variant !== 'b') {
    variant = Math.random() < 0.5 ? 'a' : 'b';
    try { localStorage.setItem('fx_handoff_v', variant); } catch (e) {}
  }
  text.textContent = TEXTS[variant];

  function track(name, p) { if (window.__trackEvent) window.__trackEvent(name, Object.assign({ text_variant: variant }, p || {})); }

  var manual = false, leaving = false, viewed = false;
  var armed = false;      // set only by a real downward scroll after load, so a restored scroll position never redirects
  var lastY = window.scrollY;

  var curtain = document.createElement('div');
  curtain.className = 'handoff-curtain';
  var img = shot.querySelector('img');
  curtain.style.backgroundImage = 'url("' + img.getAttribute('src') + '")';
  document.body.appendChild(curtain);

  function progress() {
    var r = sec.getBoundingClientRect();
    var run = sec.offsetHeight - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }

  function go(how) {
    if (leaving || manual) return;
    leaving = true;
    track('handoff_redirect', { trigger: how });
    curtain.classList.add('is-on');
    setTimeout(function () { window.location.href = URL; }, 380);
  }

  function update() {
    if (manual) return;
    var p = progress();
    shot.style.setProperty('--p', p.toFixed(3));
    bar.style.setProperty('--p', p.toFixed(3));
    if (!viewed && p > 0) { viewed = true; track('handoff_view'); }
    if (armed && p >= 0.985) go('scroll');
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > lastY + 2) armed = true; else if (y < lastY - 2) armed = false;
    lastY = y;
    requestAnimationFrame(update);
  }, { passive: true });

  // At the very bottom the page cannot scroll further, so a downward wheel or swipe also counts.
  function nudge() { if (progress() >= 0.97) { armed = true; go('gesture'); } }
  window.addEventListener('wheel', function (e) { if (e.deltaY > 0) nudge(); }, { passive: true });
  var ty = null;
  window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (ty !== null && ty - e.touches[0].clientY > 30) nudge(); }, { passive: true });
  window.addEventListener('keydown', function (e) { if (['ArrowDown', 'PageDown', 'End', ' '].indexOf(e.key) > -1) { armed = true; requestAnimationFrame(update); } });

  sec.querySelector('.handoff-stay').addEventListener('click', function () {
    manual = true;
    sec.classList.add('is-manual');
    shot.style.setProperty('--p', 1);
    track('handoff_stay');
  });

  // Back button from Freedx: the page may come back from cache scrolled to the end.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false; armed = false;
    curtain.classList.remove('is-on');
    window.scrollTo(0, sec.offsetTop - window.innerHeight * 0.6);
  });

  update();
})();
