# Smartic landing

A single-column landing in the same format as the Freedx promo page, served at `/smartic/`.

- `index.html` holds the whole page: copy, styles, block tracking and UTM tagging.
- The only interactive element is the 3D rotary controller (`src/`, React Three Fiber).
  Turning its knob (mouse, touch, keyboard) moves the page colour from white to deep
  Smartic violet. Colour stops are in `src/atmosphere/palette.ts`.
- Browsers without WebGL get a static picture of the device and a range input instead.

## Build

    npm install
    npm run build   # writes ../smartic

The build output in `../smartic` is committed, so the static host serves it as is.
Re-render `public/img/controller-poster.webp` from the scene with `?poster` if the device changes.

## Analytics

Events go to GA4 / GTM `dataLayer`: `block_view`, `landing_exit`, `cta_click`,
`controller_interaction_start`, `controller_change` (value and mood only, no personal data).
