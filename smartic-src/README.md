# Smartic promo page (v1)

Editable source for the page published at `/smartic/` (built output lives in `../smartic`).

Stack: React 18 + TypeScript, Tailwind CSS, Three.js + React Three Fiber + Drei, Framer Motion.

```bash
npm install
npm run dev        # local preview
npm run build      # writes ../smartic (commit it; the static host serves it)
```

## Where to change things

| What | File |
| --- | --- |
| All Armenian copy (hero text is approved, keep it as is) | `src/content/copy.ts` |
| Official product examples shown per category | `src/content/products.ts` |
| Showroom, links, lead endpoint, outbound UTM defaults | `src/config.ts` |
| Lighting moods (colours, labels, K) and interpolation | `src/atmosphere/palette.ts` |
| Global atmosphere state / CSS variables | `src/atmosphere/store.ts`, `AtmosphereProvider.tsx` |
| 3D controller (housing, knob, grooves, display, LEDs, studio light) | `src/three/*` |
| Sections | `src/components/*Section.tsx` |

## The lighting atmosphere

A single value 0–100 drives the page. Anchors: 0 `Ջերմ երեկո`, 50 `Բնական լույս`, 100 `Սառը լույս`.
Colours are interpolated in OKLab and written to CSS variables on `<html>`
(`--bg --bg-2 --surface --ink --muted --line --accent --accent-ink --light --glow --lamp --daylight`).
Text colour is picked by contrast so copy stays readable through the whole range.
The value is kept in `sessionStorage`, so the mood survives scrolling and reloads in the same visit.

## Lead form

`CONFIG.leadEndpoint` is empty, so the form runs in **demo mode**: it validates but sends nothing and says so.
Set `VITE_LEAD_ENDPOINT=https://…` at build time (JSON POST: name, phone, interests[], comment, lighting_mood, attribution).
`consultation_form_submit_success` fires only after a 2xx response.

## Analytics

Events go to `window.dataLayer` (GTM) and `gtag()` if present. No IDs are hard-coded: paste the GTM snippet into `index.html`.
Personal data (name, phone, comment) is never sent to analytics. UTM and click ids (gclid, yclid, fbclid…) are captured
on first landing, kept for the session and appended to smartic.am links without overwriting existing parameters.

## Static preview of the controller

`public/img/controller-poster.webp` is rendered from the 3D scene itself (open the built page with `?poster`, capture the canvas).
Re-render it if the device design changes.

## Assets

- Apartment photos: generated for this campaign (Canva). Sources in the project's shared folder `smartic-promo/source-photos/`.
- Product photos and names: smartic.am (Nov 2026).
- Logo: supplied `Smartic_horizontal_black_blue.svg`.
