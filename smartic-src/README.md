# Smartic landing

A single-column landing in the same format as the Freedx promo page, served at `/smartic/`.

- `index.html` holds the whole page: copy, styles, block tracking and UTM tagging.
- The lighting block after chapter 01 pairs the living-room photo with the 3D rotary
  controller (`src/`, React Three Fiber). Turning the knob (mouse, touch, keyboard)
  cross-fades the room between three lightings (warm evening, natural, cool) and softly
  tints the article. Moods are in `src/atmosphere/palette.ts`; the room photos in
  `public/img/room/` were made from one shot with `tools/relight.py`.
- Each chapter has one inline highlight (`<span class="hl">`), drawn with a thin underline.
- Browsers without WebGL get a static picture of the device and a range input instead.

## Build

    npm install
    npm run build   # writes ../smartic

The build output in `../smartic` is committed, so the static host serves it as is.
Re-render `public/img/controller-poster.webp` from the scene with `?poster` if the device changes.

## Analytics

Events go to GA4 / GTM `dataLayer`: `block_view`, `landing_exit`, `cta_click`,
`controller_interaction_start`, `controller_change` (value and mood only, no personal data).
