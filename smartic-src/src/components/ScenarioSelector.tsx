import { motion } from 'framer-motion';
import { COPY } from '../content/copy';

export type ScenarioId = (typeof COPY.central.scenarios)[number]['id'];

const ICONS: Record<ScenarioId, JSX.Element> = {
  morning: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 17h16M7 17a5 5 0 0110 0M12 5v3M5.5 9.5l2 2M18.5 9.5l-2 2" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-5h-6v5H5a1 1 0 01-1-1z" />
    </svg>
  ),
  rest: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M19 14.5A7.5 7.5 0 019.5 5a7.5 7.5 0 109.5 9.5z" />
    </svg>
  ),
};

/**
 * A wall-panel style selector (inspired by in-wall control panels, not a
 * generic dashboard). Radio-group semantics, arrow-key friendly.
 */
export function ScenarioSelector({ value, onChange }: { value: ScenarioId; onChange: (id: ScenarioId) => void }) {
  const list = COPY.central.scenarios;
  return (
    <div
      className="w-full max-w-[360px] rounded-[26px] p-[6px]"
      style={{
        background: 'linear-gradient(145deg, #3a3835, #151413)',
        boxShadow: '0 40px 80px -30px rgb(0 0 0 / 0.65), inset 0 1px 0 rgb(255 255 255 / 0.12)',
      }}
    >
      <div className="rounded-[21px] bg-[#0e0d0c] p-5 text-[#f2ece4]">
        <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-white/50">
          <span>{COPY.central.panelTitle}</span>
          <span className="tabular-nums">21:40</span>
        </div>
        <div role="radiogroup" aria-label={COPY.central.panelTitle} className="mt-4 grid gap-2">
          {list.map((s, i) => {
            const on = s.id === value;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => onChange(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    onChange(list[(i + 1) % list.length].id);
                    (e.currentTarget.parentElement?.children[(i + 1) % list.length] as HTMLElement)?.focus();
                  }
                  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const j = (i + list.length - 1) % list.length;
                    onChange(list[j].id);
                    (e.currentTarget.parentElement?.children[j] as HTMLElement)?.focus();
                  }
                }}
                className="relative flex min-h-[64px] items-center gap-4 rounded-2xl px-4 text-left transition-colors duration-300"
                style={{ color: on ? '#16120e' : '#f2ece4' }}
              >
                {on && (
                  <motion.span
                    layoutId="scenario-pill"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, #f6e7cf, #e9cfa4)' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  />
                )}
                <span className="relative grid h-9 w-9 place-items-center rounded-full" style={{ background: on ? 'rgb(0 0 0 / 0.08)' : 'rgb(255 255 255 / 0.07)' }}>
                  {ICONS[s.id]}
                </span>
                <span className="relative">
                  <span className="block text-[16px] font-semibold">{s.label}</span>
                  <span className="block text-[12.5px] opacity-70">{s.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
