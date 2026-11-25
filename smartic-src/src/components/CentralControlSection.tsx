import { useState } from 'react';
import { COPY } from '../content/copy';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { ChapterHeader } from './ChapterHeader';
import { ProductInterestButton } from './ProductInterestButton';
import { ProductStrip } from './ProductStrip';
import { Reveal } from './Reveal';
import { ScenarioSelector, type ScenarioId } from './ScenarioSelector';
import { track } from '../analytics/track';

const C = COPY.central;

/** Local look of each illustrative scenario. Never touches the global atmosphere. */
const LOOK: Record<ScenarioId, { day: number; warm: number; dim: number; cool: number }> = {
  morning: { day: 0.55, warm: 0.1, dim: 0, cool: 0.45 },
  home: { day: 0.1, warm: 0.45, dim: 0.05, cool: 0 },
  rest: { day: 0, warm: 0.7, dim: 0.5, cool: 0 },
};

export function CentralControlSection() {
  const [scenario, setScenario] = useState<ScenarioId>('home');
  const look = LOOK[scenario];
  const select = (id: ScenarioId) => {
    if (id === scenario) return;
    setScenario(id);
    track('central_scenario_selected', { interaction_type: id, section_id: 'central' });
  };

  return (
    <section id="central" aria-labelledby="central-title" className="py-20 sm:py-28" style={{ background: 'var(--bg-2)' }}>
      <div className="editorial">
        <Reveal className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <ChapterHeader id="central-title" num={C.chapter} category={C.category} headline={C.headline} />
          <div className="body-copy lg:pt-10">
            {C.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-12 grid items-center gap-8 lg:grid-cols-[1.45fr_1fr]">
          <ApartmentLightingScene
            name="central"
            alt="Բնակարանի հյուրասենյակ և ճաշասենյակ՝ երեկոյան քաղաքի տեսարանով"
            className="aspect-[4/3] w-full rounded-[28px]"
            sizes="(min-width: 1024px) 60vw, 100vw"
          >
            <div aria-hidden className="scene-layer transition-opacity duration-[1400ms]" style={{ opacity: look.day, background: 'linear-gradient(180deg, rgb(255 248 236 / 0.9), rgb(255 248 236 / 0.4))', mixBlendMode: 'screen' }} />
            <div aria-hidden className="scene-layer transition-opacity duration-[1400ms]" style={{ opacity: look.cool, background: 'rgb(180 205 235)', mixBlendMode: 'soft-light' }} />
            <div aria-hidden className="scene-layer transition-opacity duration-[1400ms]" style={{ opacity: look.warm, background: 'radial-gradient(70% 70% at 40% 35%, rgb(255 170 90 / 0.9), rgb(255 170 90 / 0.15))', mixBlendMode: 'soft-light' }} />
            <div aria-hidden className="scene-layer transition-opacity duration-[1400ms]" style={{ opacity: look.dim, background: 'rgb(12 7 3)' }} />
          </ApartmentLightingScene>
          <div className="flex flex-col items-center gap-5 lg:items-start">
            <p className="text-[15px] text-muted">{C.instruction}</p>
            <ScenarioSelector value={scenario} onChange={select} />
            <p className="max-w-[360px] text-[13px] leading-relaxed text-muted">{C.note}</p>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <ProductStrip id="central" />
          <ProductInterestButton id="central" sectionId="central" />
        </div>
      </div>
    </section>
  );
}
