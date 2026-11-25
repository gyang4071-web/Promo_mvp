import { PRODUCTS } from '../content/products';
import type { CategoryId } from '../content/copy';
import { productImg } from '../lib/assets';
import { decorateOutbound } from '../analytics/attribution';
import { track } from '../analytics/track';

/** Small strip of official Smartic products for the category (links to smartic.am). */
export function ProductStrip({ id, label = 'Smartic-ի լուծումներից' }: { id: CategoryId; label?: string }) {
  const items = PRODUCTS[id];
  return (
    <div className="mt-8">
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <ul className="flex flex-wrap gap-3">
        {items.map((p) => (
          <li key={p.slug}>
            <a
              href={decorateOutbound(p.url, `product_${id}`)}
              target="_blank"
              rel="noopener"
              onClick={() => track('smartic_outbound_click', { product_category: id, interaction_type: 'product_link' })}
              className="group flex max-w-[330px] items-center gap-3 rounded-2xl border p-2 pr-4 transition-colors duration-300 hover:bg-[rgb(var(--ink-rgb)/0.04)]"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                <img src={productImg(p.slug)} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              </span>
              <span className="text-[14px] leading-snug">
                {p.name}
                <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
