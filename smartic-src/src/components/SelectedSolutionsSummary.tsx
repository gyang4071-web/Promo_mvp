import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, COPY, categoryById } from '../content/copy';
import { useInterests } from '../state/interests';
import { useAtmosphere } from '../atmosphere/AtmosphereProvider';
import { track } from '../analytics/track';
import { decorateOutbound } from '../analytics/attribution';
import { CONFIG } from '../config';
import { Reveal } from './Reveal';

const C = COPY.summary;

export function scrollToForm() {
  const form = document.getElementById('consultation');
  form?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  window.setTimeout(() => (document.getElementById('lead-name') as HTMLInputElement | null)?.focus({ preventScroll: true }), 700);
}

export function SelectedSolutionsSummary() {
  const { selected, has, toggle } = useInterests();
  const mood = useAtmosphere((p) => p.mood.label);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        track('personalized_summary_view', { selected_category_count: selected.length });
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={ref} id="summary" aria-labelledby="summary-title" className="relative overflow-hidden py-24 sm:py-32" style={{ background: 'var(--bg-2)' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(var(--glow-rgb) / 0.32), transparent)' }}
      />
      <div className="editorial relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal>
          <h2 id="summary-title" className="h-display">
            {C.headline}
          </h2>
          <p className="body-copy mt-6 max-w-[520px]">{C.body}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--glow)', boxShadow: '0 0 10px var(--glow)' }} />
            {C.moodLine} <strong style={{ color: 'var(--ink)' }}>{mood}</strong>
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                track('consultation_cta_click', { section_id: 'summary', selected_category_count: selected.length });
                scrollToForm();
              }}
            >
              {C.ctaPrimary}
            </button>
            <a
              className="btn btn-ghost"
              href={decorateOutbound(CONFIG.showroomUrl, 'showroom_summary')}
              target="_blank"
              rel="noopener"
              onClick={() => track('showroom_cta_click', { section_id: 'summary', selected_category_count: selected.length })}
            >
              {C.ctaSecondary}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="card p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-serif text-[24px]">{selected.length ? C.selectedTitle : C.emptyTitle}</h3>
              <span className="text-[14px] tabular-nums text-muted">{selected.length} / 5</span>
            </div>
            <AnimatePresence initial={false} mode="wait">
              {selected.length === 0 ? (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 text-[15px] leading-relaxed text-muted">
                  {C.emptyText}
                </motion.p>
              ) : (
                <motion.ul key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex flex-wrap gap-2">
                  {selected.map((id) => (
                    <motion.li key={id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <span className="chip" style={{ borderColor: 'var(--accent)', background: 'rgb(var(--accent-rgb) / 0.12)' }}>
                        <span aria-hidden>✓</span>
                        {categoryById(id).name}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <ul className="mt-7 divide-y" style={{ borderColor: 'var(--line)' }}>
              {CATEGORIES.map((c) => {
                const on = has(c.id);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3.5" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[16px]" style={{ color: on ? 'var(--ink)' : 'var(--muted)' }}>
                      {c.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(c.id, 'summary')}
                      aria-pressed={on}
                      aria-label={`${c.name}․ ${on ? C.remove : C.addMore}`}
                      className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors duration-300"
                      style={{
                        borderColor: on ? 'var(--accent)' : 'var(--line)',
                        background: on ? 'var(--accent)' : 'transparent',
                        color: on ? 'var(--accent-ink)' : 'var(--ink)',
                      }}
                    >
                      {on ? (
                        <>
                          <span aria-hidden>✓</span> {COPY.interest.selected}
                        </>
                      ) : (
                        <>
                          <span aria-hidden>+</span> {C.addMore}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
