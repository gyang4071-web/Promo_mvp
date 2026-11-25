import { COPY } from '../content/copy';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { ChapterHeader } from './ChapterHeader';
import { ProductInterestButton } from './ProductInterestButton';
import { ProductStrip } from './ProductStrip';
import { Reveal } from './Reveal';

const C = COPY.lighting;

export function LightingSection() {
  return (
    <section id="lighting" aria-labelledby="lighting-title" className="relative py-20 sm:py-28" style={{ background: 'var(--bg)' }}>
      <div className="editorial grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <Reveal>
          <ChapterHeader id="lighting-title" num={C.chapter} category={C.category} headline={C.headline} />
          <div className="body-copy mt-7 max-w-[560px]">
            {C.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ProductInterestButton id="lighting" sectionId="lighting" />
          </div>
          <ProductStrip id="lighting" />
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <ApartmentLightingScene
            name="living"
            alt="Հյուրասենյակի անկյուն՝ պատի թաքնված լուսավորությամբ, հատակի լամպով և փափուկ բազկաթոռով"
            className="aspect-[4/5] w-full rounded-[28px] sm:aspect-[5/6]"
            imgClassName="scale-[1.55]"
            objectPosition="18% 55%"
            sizes="(min-width: 1024px) 50vw, 100vw"
            sweep
          />
          <figure className="absolute -bottom-6 left-6 right-6 sm:left-auto sm:right-[-12px] sm:max-w-[320px]">
            <blockquote
              className="card p-5 font-serif text-[20px] leading-snug shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)]"
              style={{ color: 'var(--ink)' }}
            >
              «{C.pullQuote}»
            </blockquote>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
