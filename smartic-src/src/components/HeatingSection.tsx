import { useState } from 'react';
import { COPY } from '../content/copy';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { ChapterHeader } from './ChapterHeader';
import { ProductInterestButton } from './ProductInterestButton';
import { ProductStrip } from './ProductStrip';
import { Reveal } from './Reveal';
import { TemperatureControl, TEMP_MAX, TEMP_MIN } from './TemperatureControl';

const C = COPY.heating;

export function HeatingSection() {
  const [temp, setTemp] = useState(21.5);
  const k = (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);

  return (
    <section id="heating" aria-labelledby="heating-title" className="py-20 sm:py-28" style={{ background: 'var(--bg-2)' }}>
      <div className="editorial">
        <Reveal className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <ChapterHeader id="heating-title" num={C.chapter} category={C.category} headline={C.headline} />
          <div className="body-copy lg:pt-10">
            {C.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal className="relative mt-12">
          <ApartmentLightingScene
            name="heating"
            alt="Երեկոյան բնակարան՝ բուխարիով, փափուկ բազմոցով և ձմեռային քաղաքի տեսարանով"
            className="aspect-[4/3] w-full rounded-[28px] sm:aspect-[16/9]"
            sizes="(min-width: 1240px) 1240px, 100vw"
            objectPosition="40% 50%"
          >
            {/* local comfort glow: warmer and softer as the setpoint rises (illustrative) */}
            <div
              aria-hidden
              className="scene-layer transition-opacity duration-700"
              style={{
                background: 'radial-gradient(60% 70% at 20% 70%, rgb(255 150 70 / 0.9), rgb(255 150 70 / 0) 70%)',
                mixBlendMode: 'soft-light',
                opacity: 0.15 + k * 0.75,
              }}
            />
            <div
              aria-hidden
              className="scene-layer transition-opacity duration-700"
              style={{
                background: 'linear-gradient(180deg, rgb(150 190 235 / 0.6), rgb(150 190 235 / 0.1))',
                mixBlendMode: 'soft-light',
                opacity: (1 - k) * 0.7,
              }}
            />
            <div className="absolute left-5 top-5 flex gap-2 text-[13px] font-medium text-white sm:left-8 sm:top-8">
              <span className="rounded-full bg-black/45 px-3 py-1.5 backdrop-blur">{C.outside} · −4°</span>
              <span className="rounded-full bg-black/45 px-3 py-1.5 backdrop-blur">
                {C.inside} · {temp.toFixed(1).replace('.0', '')}°
              </span>
            </div>
            <div className="absolute bottom-8 right-8 hidden sm:block">
              <TemperatureControl value={temp} onChange={setTemp} />
            </div>
          </ApartmentLightingScene>
          <div className="-mt-16 flex justify-center px-4 sm:hidden">
            <TemperatureControl value={temp} onChange={setTemp} />
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-[15px] text-muted">{C.instruction}</p>
            <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-muted">{C.note}</p>
            <ProductStrip id="heating" />
          </div>
          <ProductInterestButton id="heating" sectionId="heating" />
        </div>
      </div>
    </section>
  );
}
