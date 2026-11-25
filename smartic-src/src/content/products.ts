import type { CategoryId } from './copy';

/** Official Smartic products shown as grounding examples (names, links and
 *  photos taken from smartic.am, Nov 2026). */
export interface ProductRef {
  slug: string;
  name: string;
  url: string;
}

export const PRODUCTS: Record<CategoryId, ProductRef[]> = {
  lighting: [
    { slug: 'ti-anti-dazzle-built-in-smart-downlight', name: 'Ti Anti-dazzle ներկառուցվող խելացի լուսարձակ', url: 'https://smartic.am/product/ti-anti-dazzle-built-in-smart-downlight/' },
    { slug: 'triac-dimmer-switch', name: 'Լուսավորությունը կարգավորող և շարժման սենսորով խելացի անջատիչ', url: 'https://smartic.am/product/triac-dimmer-switch/' },
  ],
  heating: [
    { slug: 'nature-mini-pro-smart-thermostat', name: 'Nature Mini PRO խելացի թերմոստատ', url: 'https://smartic.am/product/nature-mini-pro-smart-thermostat/' },
  ],
  windows: [
    { slug: 'smart-curtain-motor', name: 'Խելացի վարագույրի շարժիչ', url: 'https://smartic.am/product/smart-curtain-motor/' },
  ],
  central: [
    { slug: 'nature-x-pro-smart-control-panel', name: 'Nature X PRO', url: 'https://smartic.am/product/nature-x-pro-smart-control-panel/' },
  ],
  security: [
    { slug: 'defed-door-window-sensor', name: 'DEFED դռան/պատուհանի սենսոր', url: 'https://smartic.am/product/defed-door-window-sensor/' },
  ],
};
