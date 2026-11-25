/**
 * Campaign configuration. Everything that depends on the client's
 * infrastructure is set here, not in components.
 */

export const CONFIG = {
  /** Official site (verified). */
  smarticUrl: 'https://smartic.am/',

  /**
   * Showroom visit. smartic.am's own "Պատվիրեք ցուցասրահի այցելություն"
   * button leads to the contact page, so we do the same.
   * Replace when a dedicated booking flow exists.
   */
  showroomUrl: 'https://smartic.am/contact-us/',

  privacyUrl: 'https://smartic.am/privacy-policy/',

  /** Verified on smartic.am/contact-us (Nov 2026). */
  showroom: {
    address: 'Ռուբինյանց 27/3, Երևան',
    phoneDisplay: '+374 55 103090',
    phoneHref: 'tel:+37455103090',
    email: 'info@smartic.am',
    mapUrl: 'https://maps.app.goo.gl/XQbHyxxnUdVPpguy5',
  },

  /**
   * Lead destination. Empty = DEMO MODE: the form validates but never
   * pretends a request was sent. Set to an HTTPS endpoint that accepts
   * JSON POST { name, phone, interests[], comment, mood, attribution }.
   * Can also be injected at build time: VITE_LEAD_ENDPOINT=https://...
   */
  leadEndpoint: (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined) ?? '',

  /** Defaults added to outbound links when the visit carries no UTM. */
  outboundDefaults: {
    utm_source: 'promo_page',
    utm_medium: 'referral',
    utm_campaign: 'smartic_one_decision',
  },
} as const;
