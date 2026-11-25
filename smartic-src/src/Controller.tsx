import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { atmosphere } from './atmosphere/store';
import { posterUrl } from './lib/assets';
import { useMediaQuery, useReducedMotion } from './lib/useReducedMotion';

const RotaryController3D = lazy(() => import('./three/RotaryController3D'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function useAtmosphere<T>(select: (p: ReturnType<typeof atmosphere.get>) => T): T {
  return useSyncExternalStore(
    (cb) => atmosphere.subscribe(cb),
    () => select(atmosphere.get()),
  );
}

/**
 * The desktop rotary controller. Turning its knob (mouse, touch or keyboard)
 * is the only way to change the page colour. A range input appears only for
 * browsers without WebGL, where there is no knob to turn.
 */
export function Controller() {
  const compact = useMediaQuery('(max-width: 767px)');
  const wrap = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL);
  const reduced = useReducedMotion();
  const value = useAtmosphere((p) => Math.round(p.value));
  const label = useAtmosphere((p) => p.mood.label);

  // Load the 3D scene only when the block approaches the viewport.
  useEffect(() => {
    if (!webgl || !wrap.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '800px 0px' },
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
    <>
      <div ref={wrap} className="stage">
        <div aria-hidden className="stage-halo" />
        {/* static product preview while the 3D scene loads (or without WebGL) */}
        <img
          src={posterUrl}
          alt={webgl ? '' : 'Smartic լուսավորության պտտվող կարգավորիչ'}
          aria-hidden={webgl ? true : undefined}
          className="stage-poster"
          style={{ opacity: ready ? 0 : 1 }}
          draggable={false}
        />
        {webgl && near && (
          <div className="stage-canvas" style={{ opacity: ready ? 1 : 0 }}>
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
            aria-label="Էջի լույսը"
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
          <p className="stage-status" role="status">
            Կարգավորիչը բեռնվում է…
          </p>
        )}
      </div>

      <p className="stage-caption" aria-live="polite">
        <span className="stage-dot" aria-hidden />
        {label} · <strong>{value}%</strong>
      </p>
      {webgl ? (
        <p className="stage-hint">
          <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v4.5h-4.5" />
          </svg>
          Բռնիր օղակը և պտտիր
        </p>
      ) : (
        <div className="stage-fallback">
          <p>Քո դիտարկիչը չի աջակցում 3D պատկերումը, բայց լույսը կարող ես փոխել այստեղ։</p>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            aria-label="Էջի լույսը"
            aria-valuetext={`${label}, ${value}%`}
            onChange={(e) => atmosphere.set(Number(e.target.value), 'slider')}
          />
        </div>
      )}
    </>
  );
}
