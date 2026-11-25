import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './controller.css';
import { Controller } from './Controller';
import { atmosphere } from './atmosphere/store';

atmosphere.init();

/* Analytics: first turn of the knob, then the settled value after each turn (no personal data). */
type W = Window & { __trackEvent?: (name: string, params?: Record<string, unknown>) => void };
const track = (name: string, params?: Record<string, unknown>) => (window as W).__trackEvent?.(name, params);
let started = false;
let timer = 0;
atmosphere.subscribe((p, source) => {
  if (source === 'init' || source === 'tween') return;
  if (!started) {
    started = true;
    track('controller_interaction_start', { input: source });
  }
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const cur = atmosphere.get();
    track('controller_change', { value: Math.round(cur.value), mood: cur.mood.id, input: source });
  }, 900);
});

const el = document.getElementById('controller-root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Controller />
    </StrictMode>,
  );
}
