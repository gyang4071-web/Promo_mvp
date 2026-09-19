(() => {
  const bar = document.getElementById('progressBar');
  const note = document.getElementById('redirectNote');
  const sentinel = document.getElementById('redirectSentinel');
  const cancelRedirect = document.getElementById('cancelRedirect');
  const destinationShell = document.querySelector('.destination-shell');
  const destinationLink = document.querySelector('.destination-link');
  const navLinks = [...document.querySelectorAll('.story-nav a')];
  const mythSections = [...document.querySelectorAll('.myth-stage[id]')];
  const revealItems = [...document.querySelectorAll('.reveal')];

  const baseTarget = 'https://freedx.com/hy';
  let redirectTimer = null;
  let redirected = false;
  let autoRedirectEnabled = true;
  const fired = new Set();

  window.dataLayer = window.dataLayer || [];

  const track = (event, data = {}) => {
    window.dataLayer.push({ event, ...data });
  };

  const buildTarget = () => {
    const target = new URL(baseTarget);
    const current = new URL(window.location.href);
    const passthrough = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','yclid','gbraid','wbraid'];
    passthrough.forEach(key => {
      const value = current.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });
    return target.toString();
  };

  const target = buildTarget();
  if (destinationLink) destinationLink.href = target;

  track('article_start');

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    if (bar) bar.style.width = `${Math.min(100, pct)}%`;

    [25, 50, 75, 100].forEach(mark => {
      if (pct >= mark && !fired.has(`scroll_${mark}`)) {
        fired.add(`scroll_${mark}`);
        track('article_scroll', { percent: mark });
      }
    });
  };

  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  revealItems.forEach(item => revealObserver.observe(item));

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.dataset.section === visible.target.id);
    });

    const id = visible.target.id;
    if (!fired.has(id)) {
      fired.add(id);
      track('myth_view', { myth: id });
    }
  }, { rootMargin: '-30% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] });

  mythSections.forEach(section => sectionObserver.observe(section));

  const trackedBlocks = [
    ['.offer-visual', 'offer_view'],
    ['.destination-section', 'destination_preview_view']
  ];

  trackedBlocks.forEach(([selector, event]) => {
    const el = document.querySelector(selector);
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting) && !fired.has(event)) {
        fired.add(event);
        track(event);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(el);
  });

  document.querySelectorAll('a.inline-link').forEach(link => {
    link.addEventListener('click', () => {
      track('internal_article_click', { href: link.getAttribute('href') });
    });
  });

  if (destinationLink) {
    destinationLink.addEventListener('click', () => {
      track('client_site_click', { destination: target });
    });
  }

  if (destinationShell) {
    const destinationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        destinationShell.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.2 });
    destinationObserver.observe(destinationShell);
  }

  if (cancelRedirect) {
    cancelRedirect.addEventListener('click', () => {
      if (!autoRedirectEnabled) return;
      autoRedirectEnabled = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }
      cancelRedirect.textContent = 'Ավտոմատ անցումն անջատված է';
      cancelRedirect.classList.add('is-disabled');
      if (note) note.textContent = 'Կայքը կարող եք բացել՝ սեղմելով նախադիտման վրա։';
      track('auto_redirect_disabled');
    });
  }

  if (sentinel) {
    const redirectObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== sentinel) continue;

        if (entry.isIntersecting && !redirected && autoRedirectEnabled) {
          if (note) note.textContent = 'Բացվում է Freedx-ը…';
          redirectTimer = window.setTimeout(() => {
            if (!autoRedirectEnabled) return;
            redirected = true;
            track('redirect_to_client', { destination: target });
            window.location.href = target;
          }, 1200);
        } else if (!entry.isIntersecting && redirectTimer) {
          clearTimeout(redirectTimer);
          redirectTimer = null;
          if (note && autoRedirectEnabled) note.textContent = 'Էջի ավարտին կբացվի Freedx-ի կայքը…';
        }
      }
    }, { threshold: 1 });

    redirectObserver.observe(sentinel);
  }
})();