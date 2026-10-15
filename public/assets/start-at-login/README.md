# Start at login visual

Unmodified SVG assets exported from the owner-provided [lock-screen reference, 236:1413](https://www.figma.com/design/IkSrf5xF80j0PeRMzPytZ8/Glissform?node-id=236-1413), retrieved 2026-10-12:

- `notch.svg`: 128 × 25 screen notch.
- `password-dots.svg`: 53.3333 × 6.66667 six-dot strip; used as a white CSS mask with a stepped reveal, as requested.
- `sign-in-arrow.svg`: 26.6667 × 26.6667 arrow glyph.

The [ending corner reference, 236:1349](https://www.figma.com/design/IkSrf5xF80j0PeRMzPytZ8/Glissform?node-id=236-1349) shares the menu icon mask and control-center assets in `../easy-to-reach/`. Reuse them through `FeatureDesktop.tsx`, which also supplies the replacement wallpaper documented in [artwork/README.md](../../../artwork/README.md). The larger icon/control assets remain crisp throughout the zoom; the initial offscreen status group follows the reference’s smaller proportions. No Figma screenshot is used as an implementation asset.

The password field is decorative. Its dots are timed visual marks and never represent or collect a real password. Both scenes replace the reference’s fixed date and time with the same live device clock as the hero. The lock-screen hint corrects the reference’s “our” typo to “or.”
