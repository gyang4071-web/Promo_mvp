# Smartic landing

A long-form advertising article in Armenian, served at `/smartic/`: white, one centred
reading column (~700 px) shared by every heading, paragraph, link and CTA, five chapters and
three original Smartic films centred on the same axis.

- `index.html` holds the copy, the styles, UTM tagging and block tracking.
- `src/main.ts` drives the motion and the films:
  - headlines rise line by line through a mask;
  - paragraphs settle in, and the hairline rules and the chapter-03 window frame draw themselves;
  - films open through a clean mask, with a light parallax on wide screens only.
  - Everything runs once. With reduced motion nothing moves and the films wait for a tap.
- Films live in `public/video/`. They are web encodes of the original files; the content is unchanged:
  - `intro.mp4` comes from "Smartic (4)(1).mp4" and plays in the hero;
  - `lighting.mp4` comes from "Smartic v2.0(1).mp4" and plays in chapter 01;
  - `bedroom.mp4` comes from "vidssave.com … Smartic 720P.mp4" and plays in chapter 04.
  - Each film is muted, plays inline once when half visible and pauses out of view. Only one plays at a time. Each has a play/replay button; chapter 04 also has a sound toggle.
- Events, with no personal data:
  - block_view, landing_exit, cta_click;
  - product_section_view, product_link_click, smartic_cta_click;
  - video_view, video_play, video_complete and video_sound_on, each with `video_id` set to intro, lighting or central.

## Build

    npm install
    npm run build   # writes ../smartic

The build output in `../smartic` is committed, so the static host serves it as is.
