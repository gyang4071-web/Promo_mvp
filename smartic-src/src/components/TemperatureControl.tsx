import { useRef } from 'react';
import { motion } from 'framer-motion';
import { COPY } from '../content/copy';
import { track } from '../analytics/track';

const C = COPY.heating;
export const TEMP_MIN = 18;
export const TEMP_MAX = 26;

export function tempState(t: number) {
  if (t <= 20) return C.states.cool;
  if (t <= 22.5) return C.states.balanced;
  return C.states.cozy;
}

/**
 * Illustrative thermostat. Local state only — it never touches the global
 * lighting atmosphere.
 */
export function TemperatureControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const first = useRef(true);
  const set = (v: number, type: string) => {
    const next = Math.round(Math.min(TEMP_MAX, Math.max(TEMP_MIN, v)) * 2) / 2;
    onChange(next);
    if (first.current) {
      first.current = false;
      track('heating_control_interaction', { interaction_type: type, section_id: 'heating' });
    }
  };
  const k = (value - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
  const r = 70;
  const circ = Math.PI * 1.5 * r;

  return (
    <div className="card w-full max-w-[340px] p-6 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{C.controlLabel}</p>
      <div className="relative mx-auto mt-4 h-[176px] w-[176px]">
        <svg viewBox="0 0 176 176" className="h-full w-full -rotate-[225deg]" aria-hidden>
          <circle cx="88" cy="88" r={r} fill="none" stroke="rgb(var(--ink-rgb) / 0.12)" strokeWidth="8" strokeDasharray={`${circ} 999`} strokeLinecap="round" />
          <motion.circle
            cx="88"
            cy="88"
            r={r}
            fill="none"
            stroke="url(#tempGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circ} 999`}
            animate={{ strokeDashoffset: circ * (1 - k) }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#9cc3e8" />
              <stop offset="55%" stopColor="#f3c27a" />
              <stop offset="100%" stopColor="#ef8f4c" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <motion.p key={value} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-[46px] leading-none tabular-nums">
              {value.toFixed(1).replace('.0', '')}°
            </motion.p>
            <p className="mt-2 text-[13px] text-muted" aria-live="polite">
              {tempState(value)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className="btn btn-ghost h-12 w-12 shrink-0 p-0 text-xl" aria-label={C.lower} onClick={() => set(value - 0.5, 'button')}>
          −
        </button>
        <input
          type="range"
          className="plain-range w-full"
          min={TEMP_MIN}
          max={TEMP_MAX}
          step={0.5}
          value={value}
          aria-label={C.controlLabel}
          aria-valuetext={`${value}°C, ${tempState(value)}`}
          onChange={(e) => set(Number(e.target.value), 'slider')}
        />
        <button type="button" className="btn btn-ghost h-12 w-12 shrink-0 p-0 text-xl" aria-label={C.raise} onClick={() => set(value + 0.5, 'button')}>
          +
        </button>
      </div>
    </div>
  );
}
