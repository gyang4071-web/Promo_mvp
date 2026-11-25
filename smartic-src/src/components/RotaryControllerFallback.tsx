import { COPY } from '../content/copy';
import { MOODS } from '../atmosphere/palette';
import { atmosphere } from '../atmosphere/store';
import { useAtmosphere } from '../atmosphere/AtmosphereProvider';

/**
 * Accessible HTML control for the lighting atmosphere. Always present:
 * fine adjustment next to the 3D knob, and the full control when WebGL is
 * not available.
 */
export function RotaryControllerFallback({ id = 'mood-range' }: { id?: string }) {
  const value = useAtmosphere((p) => Math.round(p.value));
  const label = useAtmosphere((p) => p.mood.label);
  const moodId = useAtmosphere((p) => p.mood.id);

  return (
    <div className="w-full max-w-[460px]">
      <label htmlFor={id} className="flex items-baseline justify-between text-[14px] font-medium text-muted">
        <span>{COPY.controller.fineLabel}</span>
        <span className="tabular-nums" style={{ color: 'var(--ink)' }}>
          {label} · {value}%
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-valuetext={`${label}, ${value}%`}
        onChange={(e) => atmosphere.request(Number(e.target.value), 'slider')}
        className="mood-range mt-3 w-full"
      />
      <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label={COPY.controller.modeCaption}>
        {MOODS.map((m) => {
          const on = m.id === moodId;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => atmosphere.request(m.at === 0 ? 8 : m.at === 100 ? 94 : 50, 'keyboard')}
              className="min-h-[44px] rounded-full border px-2 text-[13px] font-medium transition-colors duration-300"
              style={{
                borderColor: on ? 'var(--accent)' : 'var(--line)',
                background: on ? 'rgb(var(--accent-rgb) / 0.14)' : 'transparent',
                color: 'var(--ink)',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
