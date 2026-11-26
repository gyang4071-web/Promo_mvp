# Smartic landing

A single-column landing in the same format as the Freedx promo page, served at `/smartic/`.

- `index.html` holds the whole page: copy, styles, block tracking and UTM tagging.
- "One apartment, one day" (after chapter 01) pairs the apartment photo (about two thirds)
  with the 3D rotary controller (`src/`, React Three Fiber). Turning the knob (mouse, touch,
  keyboard) moves the room from 09:00 to 22:00: the light grade follows the dial continuously
  and the people change at two cut points (`SCENE_CUTS` in `src/atmosphere/palette.ts`) with a
  short dissolve. The article itself stays white.
- The three scene photos in `public/img/room/day-{morning,friends,movie}-{1080,1920}.webp` are
  AI-generated variations of one master shot, aligned to a common frame. To replace them, keep
  the same camera, 16:9, and the same file names.
- Events: lighting_interaction_view, lighting_controller_first_use, lighting_controller_change
  (debounced), lighting_scene_{morning,friends,movie}, product_section_view,
  product_link_click, smartic_cta_click, plus block_view / landing_exit / cta_click.
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
