/**
 * Paid-traffic attribution.
 * - Captures UTM + click ids on first landing and keeps the ORIGINAL values
 *   for the whole session (later internal navigation never overwrites them).
 * - decorateOutbound() appends campaign parameters to links to smartic.am
 *   without overwriting parameters already present on the link.
 * - Never carries personal data.
 */
import { CONFIG } from '../config';

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
// Click identifiers of ad platforms we expect (Google Ads, Yandex Direct, Meta).
const CLICK_IDS = ['gclid', 'wbraid', 'gbraid', 'yclid', 'fbclid'] as const;
const KEY = 'smartic.attribution';

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number] | (typeof CLICK_IDS)[number], string>> & {
  landing_page?: string;
  referrer?: string;
};

let cached: Attribution | null = null;

export function captureAttribution(): Attribution {
  if (cached) return cached;
  let stored: Attribution | null = null;
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    stored = null;
  }
  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};
  [...UTM_KEYS, ...CLICK_IDS].forEach((k) => {
    const v = params.get(k);
    if (v) fresh[k] = v.slice(0, 150);
  });
  const hasFresh = Object.keys(fresh).length > 0;
  cached =
    stored && !hasFresh
      ? stored
      : {
          ...fresh,
          landing_page: window.location.origin + window.location.pathname,
          referrer: document.referrer ? new URL(document.referrer).origin : undefined,
        };
  // keep the first-touch values when the session already has some
  if (stored && hasFresh && Object.keys(stored).some((k) => k.startsWith('utm_'))) cached = stored;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* ignore */
  }
  return cached;
}

export const campaignSource = () => captureAttribution().utm_source ?? '(direct)';

export function decorateOutbound(href: string, content?: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (!/(^|\.)smartic\.am$/.test(url.hostname)) return href;
  const a = captureAttribution();
  const values: Record<string, string | undefined> = {
    utm_source: a.utm_source ?? CONFIG.outboundDefaults.utm_source,
    utm_medium: a.utm_source ? a.utm_medium : CONFIG.outboundDefaults.utm_medium,
    utm_campaign: a.utm_campaign ?? CONFIG.outboundDefaults.utm_campaign,
    utm_content: content ?? a.utm_content,
    utm_term: a.utm_term,
  };
  Object.entries(values).forEach(([k, v]) => {
    if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
  });
  return url.toString();
}
