import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { COPY } from '../content/copy';
import { atmosphere } from '../atmosphere/store';
import { useAtmosphere } from '../atmosphere/AtmosphereProvider';
import { ApartmentLightingScene } from './ApartmentLightingScene';
import { RotaryControllerFallback } from './RotaryControllerFallback';
import { Reveal } from './Reveal';
import { posterUrl } from '../lib/assets';
import { useMediaQuery, useReducedMotion } from '../lib/useReducedMotion';

const RotaryController3D = lazy(() => import('../three/RotaryController3D'));

const C = COPY.controller;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/** The stage that holds the poster, the live 3D device and the gesture zone. */
function ControllerStage({ compact }: { compact: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL);
  const reduced = useReducedMotion();
  const value = useAtmosphere((p) => Math.round(p.value));
  const label = useAtmosphere((p) => p.mood.label);

  // Load the 3D scene only when the section approaches the viewport.
  useEffect(() => {
    if (!webgl || !wrap.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [webgl]);

  const onKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const cur = atmosphere.get().value;
    const step = e.shiftKey ? 10 : 2;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = cur + step;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = cur - step;
    if (e.key === 'PageUp') next = cur + 10;
    if (e.key === 'PageDown') next = cur - 10;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 100;
    if (next === null) return;
    e.preventDefault();
    atmosphere.request(Math.round(Math.min(100, Math.max(0, next))), 'keyboard');
  }, []);

  return (
    <div ref={wrap} className="relative mx-auto aspect-square w-full max-w-[640px]">
      {/* ambient halo around the device, coloured by the room light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6%] rounded-full"
        style={{
          background: 'radial-gradient(closest-side, rgb(var(--glow-rgb) / calc(0.22 + var(--lamp) * 0.3)), rgb(var(--glow-rgb) / 0) 72%)',
          filter: 'blur(8px)',
        }}
      />
      {/* static product preview while the 3D scene loads (or without WebGL) */}
      <img
        src={posterUrl}
        alt={webgl ? '' : 'Smartic լուսավորության պտտվող կարգավորիչ'}
        aria-hidden={webgl ? true : undefined}
        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1 }}
        draggable={false}
      />
      {webgl && near && (
        <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
          <Suspense fallback={null}>
            <RotaryController3D hitRef={hitRef} onReady={() => setReady(true)} compact={compact} reducedMotion={reduced} />
          </Suspense>
        </div>
      )}
      {webgl && (
        <div
          ref={hitRef}
          className="knob-hit"
          role="slider"
          tabIndex={ready ? 0 : -1}
          aria-label="Լուսավորության մթնոլորտ"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${label}, ${value}%`}
          aria-describedby="controller-instruction"
          onKeyDown={onKey}
          style={{ display: ready ? 'block' : 'none' }}
        />
      )}
      {!ready && webgl && near && (
        <p className="absolute inset-x-0 bottom-2 text-center text-[13px] text-muted" role="status">
          {C.loading}
        </p>
      )}
      {!webgl && (
        <p className="absolute inset-x-0 bottom-0 text-center text-[13px] text-muted">{C.noWebgl}</p>
      )}
    </div>
  );
}

export function RotaryControllerSection() {
  const compact = useMediaQuery('(max-width: 767px)');
  const moodLabel = useAtmosphere((p) => p.mood.label);

  return (
    <section
      id="atmosphere"
      aria-labelledby="atmosphere-title"
      className="relative overflow-hidden"
      style={{ background: 'var(--bg-2)' }}
    >
      {/* the apartment responds behind the device */}
      <div className="absolute inset-0">
        <ApartmentLightingScene
          name="living"
          alt=""
          className="h-full w-full"
          objectPosition="60% 50%"
          sizes="100vw"
          sweep
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgb(var(--bg-rgb) / 0.96) 0%, rgb(var(--bg-rgb) / 0.82) 34%, rgb(var(--bg-rgb) / 0.22) 62%, rgb(var(--bg-rgb) / 0.3) 100%), linear-gradient(0deg, rgb(var(--bg-rgb) / 0.9) 0%, rgb(var(--bg-rgb) / 0) 30%)',
          }}
        />
      </div>

      <div className="editorial relative grid min-h-[100svh] items-center gap-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:gap-10 md:py-24">
        <Reveal className="order-1">
          <p className="kicker">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--glow)', boxShadow: '0 0 12px var(--glow)' }} />
            Smartic · Լույս
          </p>
          <h2 id="atmosphere-title" className="h-section mt-5 max-w-[520px]">
            {C.headline}
          </h2>
          <p id="controller-instruction" className="body-copy mt-5 max-w-[460px] text-muted">
            {C.instruction}
          </p>
          <div className="mt-8 hidden md:block">
            <RotaryControllerFallback id="mood-range-desktop" />
          </div>
        </Reveal>

        <div className="order-2">
          <ControllerStage compact={compact} />
          <p className="mt-2 text-center text-[14px] text-muted" aria-live="polite">
            <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: 'var(--glow)' }} />
            {C.modeCaption}՝ <strong className="font-semibold" style={{ color: 'var(--ink)' }}>{moodLabel}</strong>
          </p>
          <p className="mt-1 hidden text-center text-[12.5px] text-muted md:block">{C.hint}</p>
        </div>

        <div className="order-3 md:hidden">
          <RotaryControllerFallback id="mood-range-mobile" />
        </div>

        <p className="order-4 max-w-[560px] text-[12.5px] leading-relaxed text-muted md:col-span-2">{C.disclaimer}</p>
      </div>
    </section>
  );
}
