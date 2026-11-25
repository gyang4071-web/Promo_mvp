import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { COPY } from '../content/copy';
import { CONFIG } from '../config';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { SmarticLogo } from './SmarticLogo';
import { decorateOutbound } from '../analytics/attribution';
import { track } from '../analytics/track';
import { useReducedMotion } from '../lib/useReducedMotion';

const C = COPY.closing;

/**
 * Editorial closing: the apartment opens from a framed picture to the full
 * screen while the campaign line settles in. The visitor leaves only by
 * pressing the CTA — no automatic redirect.
 */
export function SmarticClosingTransition() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0.15, 0.75], reduced ? [1, 1] : [0.78, 1]);
  const radius = useTransform(scrollYProgress, [0.15, 0.75], reduced ? [0, 0] : [36, 0]);
  const textY = useTransform(scrollYProgress, [0.4, 0.85], reduced ? [0, 0] : [40, 0]);
  const textO = useTransform(scrollYProgress, [0.4, 0.8], [0, 1]);

  return (
    <section ref={ref} id="closing" aria-labelledby="closing-title" className="relative h-[170svh]" style={{ background: 'var(--bg)' }}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <motion.div style={{ scale, borderRadius: radius }} className="absolute inset-0 overflow-hidden">
          <ApartmentLightingScene name="living" alt="" className="h-full w-full" objectPosition="55% 50%" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(90% 80% at 50% 55%, rgb(10 6 3 / 0.35), rgb(10 6 3 / 0.82))' }}
          />
        </motion.div>
        <motion.div style={{ y: textY, opacity: textO }} className="editorial relative text-center text-[#fbf5ec]">
          <SmarticLogo className="mx-auto h-8 w-auto sm:h-10" />
          <h2 id="closing-title" className="h-display mx-auto mt-10 max-w-[900px]">
            {C.slogan}
          </h2>
          <p className="body-copy mx-auto mt-5 max-w-[520px] text-[#f3e9dc]/85">{C.line}</p>
          <a
            href={decorateOutbound(CONFIG.smarticUrl, 'closing_cta')}
            target="_blank"
            rel="noopener"
            onClick={() => track('smartic_outbound_click', { section_id: 'closing', interaction_type: 'closing_cta' })}
            className="btn mt-9 bg-[#fbf5ec] px-8 text-[#17110c] hover:bg-white"
          >
            {C.cta} <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
