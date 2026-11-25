import { COPY } from '../content/copy';
import { ChapterHeader } from './ChapterHeader';
import { CurtainInteraction } from './CurtainInteraction';
import { ProductInterestButton } from './ProductInterestButton';
import { ProductStrip } from './ProductStrip';
import { Reveal } from './Reveal';
import { productImg } from '../lib/assets';

const C = COPY.windows;

export function WindowsSection() {
  return (
    <section id="windows" aria-labelledby="windows-title" className="py-20 sm:py-28" style={{ background: 'var(--bg)' }}>
      <div className="editorial">
        <Reveal className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <ChapterHeader id="windows-title" num={C.chapter} category={C.category} headline={C.headline} />
          <div className="body-copy lg:pt-10">
            {C.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
        <Reveal className="mt-12">
          <p className="mb-5 text-[15px] text-muted">{C.instruction}</p>
          <CurtainInteraction />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <ProductStrip id="windows" />
            <div className="mt-8">
              <ProductInterestButton id="windows" sectionId="windows" />
            </div>
          </div>
          {/* secondary, quiet reference to entry control (verified on smartic.am) */}
          <aside className="card flex items-center gap-5 p-5">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white">
              <img src={productImg('smart-door-lock')} alt="" loading="lazy" className="h-full w-full object-contain p-2" />
            </span>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{C.access.title}</p>
              <p className="mt-1.5 text-[16px] leading-relaxed">{C.access.text}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
