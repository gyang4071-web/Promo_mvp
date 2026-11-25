import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../content/copy';

const SECTIONS = CATEGORIES.map((c) => ({ id: c.id, label: c.navLabel }));

/** Discreet section navigator; highlights the chapter in view. */
export function SectionNavigation({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // keep the active chip visible in the mobile row
  useEffect(() => {
    if (!compact || !active) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active, compact]);

  return (
    <nav aria-label="Բաժիններ">
      <ul
        ref={listRef}
        className={
          compact
            ? 'no-scrollbar flex gap-1 overflow-x-auto px-3 py-1.5'
            : 'flex items-center gap-1'
        }
      >
        {SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id} data-id={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={on ? 'true' : undefined}
                className="relative inline-flex min-h-[36px] items-center rounded-full px-3.5 text-[13.5px] font-medium transition-colors duration-300"
                style={{
                  color: on ? 'var(--ink)' : 'var(--muted)',
                  background: on ? 'rgb(var(--ink-rgb) / 0.08)' : 'transparent',
                }}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
