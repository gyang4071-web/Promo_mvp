import { COPY } from '../content/copy';
import { CONFIG } from '../config';
import { ConsultationForm } from './ConsultationForm';
import { Reveal } from './Reveal';
import { decorateOutbound } from '../analytics/attribution';
import { track } from '../analytics/track';

const F = COPY.consultation;

export function ConsultationSection() {
  return (
    <section id="consultation" aria-labelledby="consultation-title" className="py-20 sm:py-28" style={{ background: 'var(--bg)' }}>
      <div className="editorial grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <h2 id="consultation-title" className="h-section">
            {F.headline}
          </h2>
          <p className="body-copy mt-5 max-w-[440px] text-muted">{F.body}</p>

          <div className="mt-10 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{F.showroomTitle}</p>
            <address className="mt-3 space-y-1.5 not-italic text-[16px] leading-relaxed">
              <a href={CONFIG.showroom.mapUrl} target="_blank" rel="noopener" className="block hover:underline">
                {CONFIG.showroom.address} ↗
              </a>
              <a href={CONFIG.showroom.phoneHref} className="block hover:underline">
                {CONFIG.showroom.phoneDisplay}
              </a>
              <a href={`mailto:${CONFIG.showroom.email}`} className="block hover:underline">
                {CONFIG.showroom.email}
              </a>
            </address>
            <a
              className="btn btn-ghost mt-6"
              href={decorateOutbound(CONFIG.showroomUrl, 'showroom_consultation')}
              target="_blank"
              rel="noopener"
              onClick={() => track('showroom_cta_click', { section_id: 'consultation' })}
            >
              {COPY.summary.ctaSecondary}
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <ConsultationForm />
        </Reveal>
      </div>
    </section>
  );
}
