(() => {
  const bar = document.getElementById('progressBar');
  const note = document.getElementById('redirectNote');
  const sentinel = document.getElementById('redirectSentinel');
  const target = 'https://freedx.com/hy';
  let redirectTimer = null;
  let redirected = false;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    bar.style.width = `${Math.min(100, pct)}%`;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target !== sentinel) continue;
      if (entry.isIntersecting && !redirected) {
        note.textContent = 'Բացվում է Freedx-ը…';
        redirectTimer = window.setTimeout(() => {
          redirected = true;
          window.location.href = target;
        }, 900);
      } else if (!entry.isIntersecting && redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
        note.textContent = 'Էջի ավարտին կբացվի Freedx-ի կայքը…';
      }
    }
  }, { threshold: 1 });

  observer.observe(sentinel);
})();
