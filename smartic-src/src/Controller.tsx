import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { atmosphere } from './atmosphere/store';
import { SCENE_CUTS, SCENES, type SceneId } from './atmosphere/palette';
import { posterUrl, roomImg } from './lib/assets';
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
 * Which scene's people are on screen. It changes only at the two cut points,
 * with a little hysteresis so a knob resting on a cut doesn't flicker.
 */
function useScene(): SceneId {
  const [scene, setScene] = useState<SceneId>(() => {
    const v = atmosphere.get().value;
    return v < SCENE_CUTS[0] ? 'morning' : v < SCENE_CUTS[1] ? 'friends' : 'movie';
  });
  useEffect(
    () =>
      atmosphere.subscribe((p) => {
        const v = p.value;
        const H = 2;
        setScene((cur) => {
          if (cur === 'morning') return v >= SCENE_CUTS[1] + H ? 'movie' : v >= SCENE_CUTS[0] + H ? 'friends' : cur;
          if (cur === 'friends') return v < SCENE_CUTS[0] - H ? 'morning' : v >= SCENE_CUTS[1] + H ? 'movie' : cur;
          return v < SCENE_CUTS[0] - H ? 'morning' : v < SCENE_CUTS[1] - H ? 'friends' : cur;
        });
      }),
    [],
  );
  return scene;
}

/**
 * ONE APARTMENT, ONE DAY. The apartment photo on one side, the rotary
 * controller on the other. Turning the knob (mouse, touch or keyboard)
 * moves the same room from 09:00 to 22:00: the light grade follows the
 * dial continuously, the people change at two moments with a short
 * dissolve. No visible text: only the room, the device and a quiet hint.
 */
export function Controller() {
  const compact = useMediaQuery('(max-width: 899px)');
  const wrap = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [used, setUsed] = useState(false);
  const [webgl] = useState(hasWebGL);
  const reduced = useReducedMotion();
  const value = useAtmosphere((p) => Math.round(p.value));
  const clock = useAtmosphere((p) => p.clock);
  const label = useAtmosphere((p) => p.mood.label);
  const scene = useScene();

  // Load the 3D scene only when the block approaches the viewport.
  useEffect(() => {
    if (!wrap.current) return;
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
  }, []);

  // The rotation hint goes away for good after the first real turn.
  useEffect(
    () =>
      atmosphere.subscribe((_p, source) => {
        if (source === 'knob' || source === 'keyboard' || source === 'slider') setUsed(true);
      }),
    [],
  );

  // keys add up while the knob is still travelling to the previous key's target
  const pending = useRef<{ v: number; t: number } | null>(null);
  const onKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const p = pending.current;
    const cur = p && performance.now() - p.t < 1200 ? p.v : atmosphere.get().value;
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
    const target = Math.round(Math.min(100, Math.max(0, next)));
    pending.current = { v: target, t: performance.now() };
    atmosphere.request(target, 'keyboard');
  }, []);

  return (
    <div className="day-stage" data-scene={scene}>
      <div className="room" aria-hidden="true">
        {SCENES.map((s) => (
          <img
            key={s.id}
            className={`room-shot${s.id === scene ? ' on' : ''}`}
            src={roomImg(s.id, 1920)}
            srcSet={`${roomImg(s.id, 1080)} 1080w, ${roomImg(s.id, 1920)} 1920w`}
            sizes="(min-width: 900px) 66vw, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
        <div className="room-grade" />
        <div className="room-dim" />
        <div className="room-tv" />
      </div>

      <div className="device-panel">
        <div ref={wrap} className="stage">
          <div aria-hidden className="stage-halo" />
          <img src={posterUrl} alt="" aria-hidden className="stage-poster" style={{ opacity: ready ? 0 : 1 }} draggable={false} />
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
              aria-label="Օրվա ժամը բնակարանում"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={`${clock}, ${label}`}
              aria-describedby="controller-instruction"
              onKeyDown={onKey}
              style={{ display: ready ? 'block' : 'none' }}
            />
          )}
          {/* nonverbal hint: a thin arc that sweeps along the knob, gone after the first turn */}
          {ready && !used && (
            <svg className="turn-hint" viewBox="0 0 100 100" aria-hidden="true">
              <path className="turn-hint-arc" d="M 22 30 A 38 30 0 0 1 78 30" pathLength={1} />
              <path className="turn-hint-head" d="M 72.5 24.5 L 78.5 30.2 L 70.8 32.2" />
            </svg>
          )}
        </div>
        {!webgl && (
          <input
            className="stage-fallback"
            type="range"
            min={0}
            max={100}
            value={value}
            aria-label="Օրվա ժամը բնակարանում"
            aria-valuetext={`${clock}, ${label}`}
            onChange={(e) => atmosphere.set(Number(e.target.value), 'slider')}
          />
        )}
      </div>
    </div>
  );
}
