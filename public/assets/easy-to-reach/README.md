# Easy to reach visual

Unmodified assets exported from the owner-provided [Glissform Figma reference, 199:294](https://www.figma.com/design/IkSrf5xF80j0PeRMzPytZ8/Glissform?node-id=199-294), retrieved 2026-10-12.

- `desktop.png`: desktop wallpaper, 3840 × 2486; preserve the reference crop.
- `menu-icon-mask.png`: native Glissform menu icon alpha, 72 × 72; rendered as a 36 × 36 white mask in design coordinates.
- `control-center.svg`: native 24.7202 × 25.213 control center glyph.

Reused by `EasyToReachVisual.tsx` and `StartAtLoginVisual.tsx` through `FeatureDesktop.tsx`, with the same wallpaper crop and menu bar glyphs. Start at login uses additional Figma assets documented in `../start-at-login/README.md`; its field is a decorative illustration, not an authentication form. The macOS 26 Menu mapping supplied by Figma has no corresponding package or implementation in this repository; its static layout and glass material are recreated in the project's React/SCSS stack.
