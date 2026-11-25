import { useEffect, useState } from 'react';
import { COPY } from '../content/copy';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { ChapterHeader } from './ChapterHeader';
import { NotificationDemo } from './NotificationDemo';
import { ProductInterestButton } from './ProductInterestButton';
import { ProductStrip } from './ProductStrip';
import { Reveal } from './Reveal';
import { track } from '../analytics/track';

const C = COPY.security;

export function SecuritySection() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!shown) return;
    const t = window.setTimeout(() => setShown(false), 9000);
    return () => window.clearTimeout(t);
  }, [shown]);

  const trigger = () => {
    const next = !shown;
    setShown(next);
    if (next) track('security_demo_interaction', { interaction_type: 'simulate_door_event', section_id: 'security' });
  };

  return (
    <section id="security" aria-labelledby="security-title" className="py-20 sm:py-28" style={{ background: 'var(--bg)' }}>
      <div className="editorial">
        <Reveal className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <ChapterHeader id="security-title" num={C.chapter} category={C.category} headline={C.headline} />
          <div className="body-copy lg:pt-10">
            {C.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <ApartmentLightingScene
            name="security"
            alt="Հանգիստ երեկո բնակարանում՝ մեղմ լուսավորությամբ և պատուհանից երևացող քաղաքով"
            className="aspect-[4/3] w-full rounded-[28px] sm:aspect-[16/9]"
            sizes="(min-width: 1240px) 1240px, 100vw"
          >
            {/* quiet perimeter accent: a calm, not alarming, highlight */}
            <div
              aria-hidden
              className="scene-layer transition-opacity duration-700"
              style={{ opacity: shown ? 1 : 0, boxShadow: 'inset 0 0 0 2px rgb(var(--glow-rgb) / 0.55), inset 0 0 120px rgb(var(--glow-rgb) / 0.18)' }}
            />
            <div className="absolute right-4 top-4 z-[2] sm:right-8 sm:top-8">
              <NotificationDemo visible={shown} />
            </div>
          </ApartmentLightingScene>
        </Reveal>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button type="button" className="btn btn-primary" onClick={trigger} aria-pressed={shown}>
            {shown ? C.reset : C.trigger}
          </button>
          <p className="text-[15px] text-muted">{C.instruction}</p>
        </div>
        <p className="mt-3 text-[13px] text-muted">{C.note}</p>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <ProductStrip id="security" />
          <ProductInterestButton id="security" sectionId="security" />
        </div>
      </div>
    </section>
  );
}
