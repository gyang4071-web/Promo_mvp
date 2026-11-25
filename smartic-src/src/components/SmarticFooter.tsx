import { COPY } from '../content/copy';
import { CONFIG } from '../config';
import { SmarticLogo } from './SmarticLogo';

export function SmarticFooter() {
  return (
    <footer className="border-t py-12" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
      <div className="editorial grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div>
          <SmarticLogo className="h-6 w-auto" />
          <address className="mt-5 space-y-1 not-italic text-[14px] text-muted">
            <p>{CONFIG.showroom.address}</p>
            <p>
              <a href={CONFIG.showroom.phoneHref} className="hover:underline">
                {CONFIG.showroom.phoneDisplay}
              </a>{' '}
              ·{' '}
              <a href={`mailto:${CONFIG.showroom.email}`} className="hover:underline">
                {CONFIG.showroom.email}
              </a>
            </p>
          </address>
        </div>
        <p className="text-[12.5px] leading-relaxed text-muted">{COPY.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
