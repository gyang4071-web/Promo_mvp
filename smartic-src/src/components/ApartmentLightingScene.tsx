import { useEffect, useRef, type ReactNode } from 'react';
import { atmosphere } from '../atmosphere/store';
import { scene } from '../lib/assets';

type SceneName = Parameters<typeof scene>[0];

/** Where the lamps are in each photo (percent), used to mask the light. */
const LAMPS: Record<SceneName, { x: number; y: number; r: number }[]> = {
  living: [
    { x: 12, y: 30, r: 26 }, // wall cove, left
    { x: 58, y: 30, r: 18 }, // pendant
    { x: 31, y: 40, r: 14 }, // floor lamp
    { x: 50, y: 6, r: 40 }, // ceiling cove
  ],
  heating: [
    { x: 14, y: 55, r: 20 },
    { x: 90, y: 34, r: 14 },
    { x: 96, y: 42, r: 14 },
  ],
  windows: [{ x: 6, y: 40, r: 22 }],
  central: [
    { x: 6, y: 30, r: 18 },
    { x: 85, y: 12, r: 30 },
  ],
  security: [
    { x: 22, y: 30, r: 22 },
    { x: 80, y: 42, r: 14 },
    { x: 50, y: 4, r: 40 },
  ],
};

/** Which side the windows (daylight) are on. */
const WINDOW_SIDE: Record<SceneName, string> = {
  living: '62% 32%',
  heating: '55% 30%',
  windows: '50% 35%',
  central: '45% 35%',
  security: '62% 38%',
};

/**
 * A photo of the apartment with layered, masked light overlays driven by
 * the global atmosphere — never a global CSS filter on the photograph.
 * Optional `children` render above the light layers (UI, curtains…).
 */
export function ApartmentLightingScene({
  name,
  alt,
  className = '',
  imgClassName = '',
  sizes = '100vw',
  priority = false,
  sweep = false,
  children,
  objectPosition,
}: {
  name: SceneName;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** play the travelling light band when the dial settles */
  sweep?: boolean;
  children?: ReactNode;
  objectPosition?: string;
}) {
  const img = scene(name);
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sweep) return;
    let lastMood = atmosphere.get().mood.id;
    let lastRun = 0;
    let timer = 0;
    const run = () => {
      const el = sweepRef.current;
      if (!el) return;
      el.classList.remove('run');
      void el.offsetWidth;
      el.classList.add('run');
      lastRun = performance.now();
    };
    return atmosphere.subscribe((p, source) => {
      if (source === 'init') return;
      // a light band crosses the wall when the zone changes, or after the
      // dial settles on a new position
      if (p.mood.id !== lastMood) {
        lastMood = p.mood.id;
        if (performance.now() - lastRun > 900) run();
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (performance.now() - lastRun > 1500) run();
      }, 350);
    });
  }, [sweep]);

  const lampGradients = LAMPS[name]
    .map((l) => `radial-gradient(${l.r}% ${l.r * 1.3}% at ${l.x}% ${l.y}%, rgb(var(--light-rgb) / 0.95), rgb(var(--light-rgb) / 0) 70%)`)
    .join(',');

  return (
    <div className={`scene ${className}`} style={{ backgroundImage: `url(${img.lqip})`, backgroundSize: 'cover' }}>
      <img
        className={`scene-photo ${imgClassName}`}
        src={img.src}
        srcSet={img.srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...({ fetchpriority: priority ? 'high' : 'auto' } as Record<string, string>)}
        style={objectPosition ? { objectPosition } : undefined}
      />
      <div className="scene-layer scene-temp" />
      <div className="scene-layer scene-lamps breathe" style={{ backgroundImage: lampGradients }} />
      <div
        className="scene-layer scene-day"
        style={{ background: `radial-gradient(70% 70% at ${WINDOW_SIDE[name]}, rgb(235 243 255 / 0.95), rgb(235 243 255 / 0.25) 70%)` }}
      />
      <div className="scene-layer scene-dim" />
      {sweep && <div ref={sweepRef} className="scene-layer scene-sweep" />}
      {children}
    </div>
  );
}
