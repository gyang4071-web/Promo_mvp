import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './controller.css';
import { Controller } from './Controller';
import { atmosphere } from './atmosphere/store';
import { sceneAt } from './atmosphere/palette';

atmosphere.init();

/* Analytics (no personal data): view of the block, first use, settled changes, scene reached. */
type W = Window & { __trackEvent?: (name: string, params?: Record<string, unknown>) => void };
const track = (name: string, params?: Record<string, unknown>) => (window as W).__trackEvent?.(name, params);
let started = false;
let timer = 0;
let lastScene = sceneAt(atmosphere.get().value).id;
const seen = new Set<string>();
atmosphere.subscribe((p, source) => {
  if (source === 'init') return;
  const sc = sceneAt(p.value).id;
  if (started && sc !== lastScene) {
    lastScene = sc;
    if (!seen.has(sc)) {
      seen.add(sc);
      track(`lighting_scene_${sc}`, { clock: p.clock });
    }
  }
  if (source === 'tween') return;
  if (!started) {
    started = true;
    track('lighting_controller_first_use', { input: source });
  }
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const cur = atmosphere.get();
    track('lighting_controller_change', { value: Math.round(cur.value), scene: sceneAt(cur.value).id, clock: cur.clock, input: source });
  }, 900);
});

const block = document.getElementById('controller');
if (block && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        track('lighting_interaction_view');
        io.disconnect();
      }
    },
    { threshold: 0.5 },
  );
  io.observe(block);
}

const el = document.getElementById('controller-root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Controller />
    </StrictMode>,
  );
}
