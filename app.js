(() => {
  const bar = document.getElementById('progressBar');
  const note = document.getElementById('redirectNote');
  const sentinel = document.getElementById('redirectSentinel');
  const target = 'https://freedx.com/hy';
  const navLinks = [...document.querySelectorAll('.story-nav a')];
  const mythSections = [...document.querySelectorAll('.myth-stage[id]')];
  let redirectTimer = null;
  let redirected = false;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    if (bar) bar.style.width = `${Math.min(100, pct)}%`;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.dataset.section === visible.target.id);
    });
  }, { rootMargin: '-30% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] });

  mythSections.forEach(section => sectionObserver.observe(section));

  if (sentinel) {
    const redirectObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== sentinel) continue;
        if (entry.isIntersecting && !redirected) {
          if (note) note.textContent = 'Բացվում է Freedx-ը…';
          redirectTimer = window.setTimeout(() => {
            redirected = true;
            window.location.href = target;
          }, 900);
        } else if (!entry.isIntersecting && redirectTimer) {
          clearTimeout(redirectTimer);
          redirectTimer = null;
          if (note) note.textContent = 'Էջի ավարտին կբացվի Freedx-ի կայքը…';
        }
      }
    }, { threshold: 1 });
    redirectObserver.observe(sentinel);
  }
})();
