/**
 * Analytics abstraction for GA4 / Google Tag Manager.
 * Events go to window.dataLayer (GTM) and to gtag() when present.
 * No container or measurement IDs are hard-coded: add the GTM snippet to
 * index.html (see README) and every event below starts flowing.
 *
 * Rule: never pass names, phone numbers or free text here.
 */
import { campaignSource } from './attribution';

export type EventName =
  | 'promo_page_view'
  | 'hero_view'
  | 'hero_scroll'
  | 'section_view'
  | 'scroll_depth'
  | 'lighting_dial_first_interaction'
  | 'lighting_dial_change'
  | 'lighting_mood_selected'
  | 'heating_control_interaction'
  | 'curtain_control_interaction'
  | 'central_scenario_selected'
  | 'security_demo_interaction'
  | 'solution_interest_selected'
  | 'solution_interest_removed'
  | 'personalized_summary_view'
  | 'consultation_cta_click'
  | 'consultation_form_start'
  | 'consultation_form_submit_success'
  | 'showroom_cta_click'
  | 'smartic_outbound_click';

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const PII_KEYS = /name|phone|tel|email|comment|message/i;

export function track(event: EventName, params: Params = {}) {
  const clean: Params = { campaign_source: campaignSource() };
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || PII_KEYS.test(k)) return;
    clean[k] = v;
  });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...clean });
  if (typeof window.gtag === 'function') window.gtag('event', event, clean);
  if (import.meta.env.DEV) console.debug('[track]', event, clean);
}

/** Fire once per key. */
const fired = new Set<string>();
export function trackOnce(key: string, event: EventName, params?: Params) {
  if (fired.has(key)) return;
  fired.add(key);
  track(event, params);
}
