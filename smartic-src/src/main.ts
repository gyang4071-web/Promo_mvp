/*
  Motion and films for the Smartic promo page.
  - Headlines rise line by line through a mask, paragraphs settle in, rules draw themselves,
    the window frame in chapter 03 is drawn in hairlines, films open through a clean mask.
  - Two elements drift very slightly with scroll (the hero film and the chapter-01 numeral).
  - Films: muted, inline, played once when visible, paused when out of view, one at a time.
  Everything runs once per element. With reduced motion nothing moves and films wait for a tap.
*/

type W = Window & { __trackEvent?: (name: string, params?: Record<string, unknown>) => void; __motionReady?: boolean };
const win = window as W;
win.__motionReady = true;

const track = (name: string, params?: Record<string, unknown>) => win.__trackEvent?.(name, params);
const root = document.documentElement;
const motion = root.classList.contains('motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- line-by-line headlines ---------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function splitLines(el: HTMLElement) {
  const text = el.dataset.text ?? (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  el.dataset.text = text;
  const words = text.split(' ');
  el.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
  const lines: string[][] = [];
  let top = Number.NaN;
  el.querySelectorAll<HTMLElement>('.w').forEach((w) => {
    const t = w.offsetTop;
    if (!(Math.abs(t - top) < 4)) {
      lines.push([]);
      top = t;
    }
    lines[lines.length - 1].push(w.textContent ?? '');
  });
  el.innerHTML = lines
    .map((l, i) => `<span class="ln"><span class="ln-i" style="--i:${i}">${l.map(esc).join(' ')}</span></span>`)
    .join('');
  el.classList.add('is-split');
}

const lineEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal="lines"]'));

function restore(el: HTMLElement) {
  if (el.dataset.text) el.textContent = el.dataset.text;
}

if (motion) {
  const run = () => lineEls.forEach((el) => (el.classList.contains('is-in') ? undefined : splitLines(el)));
  (document.fonts?.ready ?? Promise.resolve()).then(run);
  run();
  let lastW = innerWidth;
  let t = 0;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(t);
    t = window.setTimeout(() => {
      lineEls.forEach((el) => {
        if (el.classList.contains('is-in')) restore(el);
        else splitLines(el);
      });
    }, 150);
  });
}

/* ---------- reveal once ---------- */

if (motion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        el.classList.add('is-in');
        io.unobserve(el);
        // once the lines have risen, give the headline back its natural, resizable text
        if (el.dataset.reveal === 'lines') setTimeout(() => restore(el), 2600);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  // the hero headline answers the film right away when it is already on the first screen
  const h1 = document.querySelector<HTMLElement>('.hero-title');
  if (h1 && h1.getBoundingClientRect().top < innerHeight) {
    setTimeout(() => {
      h1.classList.add('is-in');
      io.unobserve(h1);
      setTimeout(() => restore(h1), 2600);
    }, 700);
  }

  // the violet underline draws once the sentence is well inside the screen
  const hl = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          hl.unobserve(en.target);
        }
      }),
    { rootMargin: '0px 0px -20% 0px', threshold: 1 },
  );
  document.querySelectorAll('.hl').forEach((el) => hl.observe(el));
}

/* ---------- restrained depth ---------- */

// only on wide screens, where there is room for it; phones keep a still, steady column
if (motion && matchMedia('(min-width: 1024px)').matches) {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const visible = new Set<HTMLElement>();
  const vio = new IntersectionObserver((entries) =>
    entries.forEach((en) => (en.isIntersecting ? visible.add(en.target as HTMLElement) : visible.delete(en.target as HTMLElement))),
  );
  items.forEach((el) => vio.observe(el));
  let ticking = false;
  const update = () => {
    ticking = false;
    const mid = innerHeight / 2;
    visible.forEach((el) => {
      const f = Number(el.dataset.parallax) || 0;
      const r = el.getBoundingClientRect();
      const off = Math.max(-60, Math.min(60, (r.top + r.height / 2 - mid) * f));
      el.style.translate = `0 ${off.toFixed(1)}px`;
    });
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

/* ---------- films ---------- */

type Film = { id: string; fig: HTMLElement; v: HTMLVideoElement; userPaused: boolean; autoTried: boolean; viewed: boolean; completed: boolean; trigger: string };
const films: Film[] = Array.from(document.querySelectorAll<HTMLElement>('[data-video]')).map((fig) => ({
  id: fig.dataset.video ?? '',
  fig,
  v: fig.querySelector('video') as HTMLVideoElement,
  userPaused: false,
  autoTried: false,
  viewed: false,
  completed: false,
  trigger: 'auto',
}));

function setState(f: Film) {
  f.fig.dataset.state = f.v.ended ? 'ended' : f.v.paused ? 'paused' : 'playing';
  const btn = f.fig.querySelector('.film-toggle');
  btn?.setAttribute('aria-label', f.v.ended ? 'Կրկին դիտել' : f.v.paused ? 'Նվագարկել' : 'Դադար');
}

function play(f: Film, trigger: 'auto' | 'user') {
  films.forEach((o) => o !== f && !o.v.paused && o.v.pause());
  f.trigger = trigger;
  if (f.v.ended) f.v.currentTime = 0;
  if (f.v.preload !== 'auto') f.v.preload = 'auto';
  f.v.play().catch(() => setState(f));
}

films.forEach((f) => {
  setState(f);
  ['play', 'pause', 'ended', 'playing'].forEach((ev) => f.v.addEventListener(ev, () => setState(f)));
  // a play from the start or by the visitor counts; quiet resumes after scrolling back do not
  f.v.addEventListener('play', () => {
    films.forEach((o) => o !== f && !o.v.paused && o.v.pause()); // never two films at once
    if (f.trigger === 'user' || f.v.currentTime < 0.3) track('video_play', { video_id: f.id, trigger: f.trigger });
  });
  f.v.addEventListener('ended', () => {
    if (!f.completed) {
      f.completed = true;
      track('video_complete', { video_id: f.id });
    }
  });
  f.fig.querySelector('.film-toggle')?.addEventListener('click', () => {
    if (f.v.paused || f.v.ended) {
      f.userPaused = false;
      play(f, 'user');
    } else {
      f.userPaused = true;
      f.v.pause();
    }
  });
  const snd = f.fig.querySelector<HTMLButtonElement>('.film-sound');
  snd?.addEventListener('click', () => {
    f.v.muted = !f.v.muted;
    snd.setAttribute('aria-pressed', String(!f.v.muted));
    snd.setAttribute('aria-label', f.v.muted ? 'Միացնել ձայնը' : 'Անջատել ձայնը');
    if (!f.v.muted) {
      track('video_sound_on', { video_id: f.id });
      if (f.v.paused) {
        f.userPaused = false;
        play(f, 'user');
      }
    }
  });
});

// warm up a film shortly before it arrives
const near = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const v = (en.target as HTMLElement).querySelector('video');
      if (v && v.preload === 'none') v.preload = 'metadata';
      near.unobserve(en.target);
    }),
  { rootMargin: '600px 0px' },
);

// play when at least half is on screen (once, unless the visitor asks again); pause when it leaves
const seen = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      const f = films.find((x) => x.fig === en.target);
      if (!f) return;
      if (en.intersectionRatio >= 0.5) {
        if (!f.viewed) {
          f.viewed = true;
          track('video_view', { video_id: f.id });
        }
        if (!reduced && !f.userPaused && !f.v.ended && f.v.paused && (!f.autoTried || f.v.currentTime > 0)) {
          f.autoTried = true;
          play(f, 'auto');
        }
      } else if (en.intersectionRatio < 0.2 && !f.v.paused) {
        f.v.pause();
      }
    }),
  { threshold: [0, 0.2, 0.5] },
);

films.forEach((f) => {
  near.observe(f.fig);
  seen.observe(f.fig);
});
