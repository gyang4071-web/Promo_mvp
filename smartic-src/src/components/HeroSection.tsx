import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { COPY } from '../content/copy';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { track, trackOnce } from '../analytics/track';

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0.25]);

  useEffect(() => {
    track('hero_view', { section_id: 'hero' });
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.35) {
        trackOnce('hero_scroll', 'hero_scroll', { section_id: 'hero' });
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const words = COPY.hero.headline.split(' ');

  return (
    <section ref={ref} id="hero" aria-labelledby="hero-title" className="relative">
      {/* Photo + overlay text (desktop), photo + headline (mobile) */}
      <div className="relative h-[76svh] min-h-[520px] overflow-hidden md:h-[100svh] md:min-h-[680px]">
        <motion.div style={{ y: imgY }} className="absolute inset-0">
          <ApartmentLightingScene
            name="living"
            alt="Ժամանակակից բնակարանի հյուրասենյակ՝ երեկոյան մեղմ լուսավորությամբ և քաղաքի տեսարանով"
            className="h-full w-full"
            imgClassName="kenburns"
            priority
            objectPosition="58% 50%"
          />
        </motion.div>
        {/* legibility gradients (not a filter on the photo) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgb(12 8 5 / 0.55) 0%, rgb(12 8 5 / 0) 22%), linear-gradient(0deg, rgb(12 8 5 / 0.88) 0%, rgb(12 8 5 / 0.35) 42%, rgb(12 8 5 / 0) 65%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{ background: 'linear-gradient(90deg, rgb(12 8 5 / 0.72) 0%, rgb(12 8 5 / 0.35) 38%, rgb(12 8 5 / 0) 62%)' }}
        />

        <motion.div style={{ opacity: fade }} className="absolute inset-x-0 bottom-0 pb-8 md:bottom-auto md:top-0 md:flex md:h-full md:items-center md:pb-0">
          <div className="editorial text-[#f7efe4]">
            <div className="max-w-[640px] lg:max-w-[720px]">
              <motion.p
                className="mb-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f7efe4]/75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease }}
              >
                {COPY.hero.kicker}
              </motion.p>
              <h1 id="hero-title" className="h-display text-[#fbf5ec]">
                {words.map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={{ y: '105%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      transition={{ duration: 1.05, ease, delay: 0.15 + i * 0.07 }}
                    >
                      {w}
                      {i < words.length - 1 ? ' ' : ''}
                    </motion.span>
                  </span>
                ))}
              </h1>
              <motion.div
                className="body-copy mt-7 hidden max-w-[560px] text-[#f3e9dc]/90 md:block"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 0.9 }}
              >
                {COPY.hero.lead.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <a
          href="#lighting"
          className="group absolute bottom-8 right-6 hidden items-center gap-3 text-[14px] font-medium text-[#f7efe4]/85 md:right-12 md:flex"
        >
          {COPY.hero.scrollCue}
          <span aria-hidden className="relative h-12 w-px overflow-hidden bg-white/25">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_2.2s_ease-in-out_infinite] bg-white motion-reduce:animate-none" />
          </span>
        </a>
      </div>

      {/* Mobile: lead below the photo so it stays readable */}
      <div className="editorial pb-4 pt-8 md:hidden">
        <div className="body-copy">
          {COPY.hero.lead.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <a href="#lighting" className="mt-8 inline-flex items-center gap-3 text-[15px] font-medium text-muted">
          {COPY.hero.scrollCue}
          <span aria-hidden>↓</span>
        </a>
      </div>
    </section>
  );
}
