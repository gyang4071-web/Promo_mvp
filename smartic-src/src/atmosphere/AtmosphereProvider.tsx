import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { atmosphere } from './store';
import type { Palette } from './palette';
import { track } from '../analytics/track';

const Ctx = createContext(atmosphere);

/**
 * GlobalAtmosphereProvider — exposes the shared lighting state.
 * Colours reach the page through CSS custom properties written by the store
 * (--bg, --bg-2, --surface, --ink, --muted, --line, --accent, --accent-ink,
 * --light, --glow, --lamp, --daylight, --warmth, --dial).
 */
export function GlobalAtmosphereProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    atmosphere.init();
  }, []);
  useDialAnalytics();
  return <Ctx.Provider value={atmosphere}>{children}</Ctx.Provider>;
}

export const useAtmosphereStore = () => useContext(Ctx);

/**
 * Subscribe to a derived primitive of the palette. The component re-renders
 * only when the selected value changes (e.g. the rounded percentage or the
 * mood label), not on every animation frame.
 */
export function useAtmosphere<T extends string | number | boolean>(select: (p: Palette) => T): T {
  const store = useContext(Ctx);
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => select(store.get()),
    () => select(store.get()),
  );
}

/**
 * Analytics for the dial: one "first interaction", then one "change" and,
 * if the zone changed, one "mood selected" event per settled interaction —
 * never hundreds of events during a rotation.
 */
function useDialAnalytics() {
  const first = useRef(true);
  const lastMood = useRef(atmosphere.get().mood.id);
  const timer = useRef(0);
  useEffect(
    () =>
      atmosphere.subscribe((p, source) => {
        if (source === 'init' || source === 'tween') return;
        if (first.current) {
          first.current = false;
          track('lighting_dial_first_interaction', { interaction_type: source, lighting_mood: p.mood.id });
        }
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          const cur = atmosphere.get();
          track('lighting_dial_change', {
            interaction_type: source,
            lighting_mood: cur.mood.id,
            lighting_value: Math.round(cur.value),
          });
          if (cur.mood.id !== lastMood.current) {
            lastMood.current = cur.mood.id;
            track('lighting_mood_selected', { lighting_mood: cur.mood.id });
          }
        }, 900);
      }),
    [],
  );
}
