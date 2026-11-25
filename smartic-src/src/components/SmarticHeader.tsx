import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SmarticLogo } from './SmarticLogo';
import { SectionNavigation } from './SectionNavigation';
import { COPY } from '../content/copy';
import { useAtmosphere } from '../atmosphere/AtmosphereProvider';
import { track } from '../analytics/track';
import { decorateOutbound } from '../analytics/attribution';
import { CONFIG } from '../config';

/** Sticky header: logo, discreet section navigator (after the hero), consult CTA. */
export function SmarticHeader() {
  const [pastHero, setPastHero] = useState(false);
  const moodLabel = useAtmosphere((p) => p.mood.label);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-500"
      style={{
        background: pastHero ? 'rgb(var(--bg-rgb) / 0.86)' : 'transparent',
        backdropFilter: pastHero ? 'saturate(1.2) blur(14px)' : undefined,
        WebkitBackdropFilter: pastHero ? 'saturate(1.2) blur(14px)' : undefined,
        boxShadow: pastHero ? '0 1px 0 var(--line)' : undefined,
        color: pastHero ? 'var(--ink)' : '#f7efe4',
      }}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-[var(--surface)] focus:px-4 focus:py-2">
        {COPY.header.skip}
      </a>
      <div className="editorial flex h-16 items-center gap-4">
        <a
          href={decorateOutbound(CONFIG.smarticUrl, 'header_logo')}
          target="_blank"
          rel="noopener"
          onClick={() => track('smartic_outbound_click', { interaction_type: 'header_logo' })}
          className="shrink-0"
        >
          <SmarticLogo className="h-[22px] w-auto sm:h-6" />
        </a>
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          {pastHero && <SectionNavigation />}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {pastHero && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden items-center gap-2 text-[13px] text-muted xl:flex"
              aria-live="polite"
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--glow)', boxShadow: '0 0 10px var(--glow)' }} />
              {moodLabel}
            </motion.span>
          )}
          <a
            href="#consultation"
            onClick={() => track('consultation_cta_click', { section_id: 'header' })}
            className="btn min-h-[40px] px-4 text-[14px]"
            style={{
              border: '1px solid currentColor',
              color: 'inherit',
            }}
          >
            {COPY.header.consult}
          </a>
        </div>
      </div>
      {pastHero && (
        <div className="border-t lg:hidden" style={{ borderColor: 'var(--line)' }}>
          <SectionNavigation compact />
        </div>
      )}
    </header>
  );
}
