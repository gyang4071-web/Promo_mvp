import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { COPY } from '../content/copy';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { track } from '../analytics/track';
import { useReducedMotion } from '../lib/useReducedMotion';

const C = COPY.windows;

/**
 * Curtains over the window wall. Openness 0 (closed) … 1 (open).
 * Opening reveals the view and lets daylight in; closing dims the daylight
 * and the room's own lamps become more noticeable.
 */
export function CurtainInteraction() {
  const open = useMotionValue(0.4);
  const [pct, setPct] = useState(40);
  const reduced = useReducedMotion();
  const tracked = useRef(false);

  useMotionValueEvent(open, 'change', (v) => setPct(Math.round(v * 100)));

  // each panel covers 50% when closed and gathers to ~9% when open
  const panelW = useTransform(open, (v) => `${50 - v * 41}%`);
  const pleat = useTransform(open, (v) => `${46 - v * 28}px`);
  const daylight = useTransform(open, [0, 1], [0.12, 1]);
  const lamps = useTransform(open, [0, 1], [0.85, 0.15]);
  const shade = useTransform(open, [0, 1], [0.55, 0]);
  const dayOpacity = useTransform(daylight, (d) => d * 0.35);
  const lampOnFabric = useTransform(open, [0, 0.7], [1, 0]);

  const note = (type: string) => {
    if (tracked.current) return;
    tracked.current = true;
    track('curtain_control_interaction', { interaction_type: type, section_id: 'windows' });
  };
  const go = (to: number, type: string) => {
    note(type);
    animate(open, to, reduced ? { duration: 0 } : { duration: 3.2, ease: [0.45, 0.05, 0.25, 1] });
  };

  return (
    <div>
      <ApartmentLightingScene
        name="windows"
        alt="Լուսավոր բնակարան՝ հատակից առաստաղ պատուհաններով և առավոտյան քաղաքի տեսարանով"
        className="aspect-[4/3] w-full rounded-[28px] sm:aspect-[16/9]"
        sizes="(min-width: 1240px) 1240px, 100vw"
      >
        {/* daylight entering: brightens the room from the window side */}
        <motion.div
          aria-hidden
          className="scene-layer"
          style={{
            opacity: dayOpacity,
            background: 'radial-gradient(80% 90% at 55% 30%, rgb(255 250 238 / 1), rgb(255 250 238 / 0) 75%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* room darkens when curtains close… */}
        <motion.div aria-hidden className="scene-layer" style={{ opacity: shade, background: 'rgb(20 12 6)' }} />
        {/* …and the warm lamps take over */}
        <motion.div
          aria-hidden
          className="scene-layer"
          style={{
            opacity: lamps,
            background:
              'radial-gradient(30% 50% at 8% 40%, rgb(var(--light-rgb) / 0.75), transparent 70%), radial-gradient(40% 30% at 50% 0%, rgb(var(--light-rgb) / 0.5), transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* curtain rod */}
        <div aria-hidden className="absolute inset-x-0 top-0 z-[2] h-3 bg-gradient-to-b from-[#2a2521] to-[#4a423b] shadow-md" />
        {/* left and right panels */}
        <motion.div
          aria-hidden
          className="curtain curtain-l z-[1]"
          style={{ left: 0, width: panelW, ['--pleat' as string]: pleat }}
        />
        <motion.div
          aria-hidden
          className="curtain curtain-r z-[1]"
          style={{ right: 0, width: panelW, ['--pleat' as string]: pleat }}
        />
        {/* with curtains drawn, the room's own lamps light the fabric */}
        <motion.div
          aria-hidden
          className="scene-layer z-[2]"
          style={{
            opacity: lampOnFabric,
            background:
              'radial-gradient(45% 75% at 12% 70%, rgb(var(--light-rgb) / 0.55), transparent 70%), radial-gradient(60% 40% at 55% 0%, rgb(var(--light-rgb) / 0.35), transparent 70%), linear-gradient(0deg, rgb(20 12 6 / 0.35), transparent 40%)',
            mixBlendMode: 'multiply',
          }}
        />
        <motion.div
          aria-hidden
          className="scene-layer z-[2]"
          style={{
            opacity: lampOnFabric,
            background: 'radial-gradient(40% 70% at 12% 68%, rgb(var(--light-rgb) / 0.5), transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
      </ApartmentLightingScene>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex gap-3" role="group" aria-label={C.sliderLabel}>
          <button type="button" className="btn btn-primary" onClick={() => go(1, 'open')} aria-pressed={pct >= 95}>
            {C.open}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => go(0, 'close')} aria-pressed={pct <= 5}>
            {C.close}
          </button>
        </div>
        <label className="flex flex-1 items-center gap-4 text-[14px] text-muted">
          <span className="shrink-0">{C.sliderLabel}</span>
          <input
            type="range"
            className="plain-range w-full"
            min={0}
            max={100}
            value={pct}
            aria-valuetext={`${pct}%`}
            onChange={(e) => {
              note('slider');
              open.stop();
              open.set(Number(e.target.value) / 100);
            }}
          />
          <span className="w-10 shrink-0 text-right tabular-nums" style={{ color: 'var(--ink)' }}>
            {pct}%
          </span>
        </label>
      </div>
    </div>
  );
}
