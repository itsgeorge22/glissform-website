# Easy to reach visual

Unmodified menu assets exported from the owner-provided Glissform Figma reference, 199:294 (original design reference), retrieved 2026-10-12.

- `menu-icon-mask.png`: native Glissform menu icon alpha, 72 × 72; rendered as a 36 × 36 white mask in design coordinates.
- `control-center.svg`: native 24.7202 × 25.213 control center glyph.

Reused by `EasyToReachVisual.tsx` and `StartAtLoginVisual.tsx` through `FeatureDesktop.tsx`. Their former 3840 × 2486 `desktop.png` export was replaced on 2026-10-15 with the owner-supplied wallpaper documented in [artwork/README.md](../../../artwork/README.md). Both demos now share responsive, lazily loaded WebP assets. The existing scene framing is retained, with `object-fit: cover` preserving the replacement image's proportions.

Start at login uses additional Figma assets documented in `../start-at-login/README.md`; its field is a decorative illustration, not an authentication form. The macOS 26 Menu mapping supplied by Figma has no corresponding package or implementation in this repository; its static layout and glass material are recreated in the project's React/SCSS stack.
