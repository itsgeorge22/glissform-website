# Settings preview icons

Unmodified SVG assets from the owner-provided Always active Figma reference (original design reference), retrieved 2026-10-12.

`background.svg`, `menubar.svg`, `login.svg` and `updates.svg` retain their exported geometry and are used by `AlwaysActiveVisual.tsx`. They represent the four General settings rows, separate from the blue feature-heading icons.

The enabled Run in background icon uses `background-mask.svg`, derived from `background.svg` by setting the two paths’ fill opacity to 1. Geometry is unchanged. This lets the CSS mask render the exact #0073FF color of the feature copy icon without the original 50% opacity washing it out. The original export is unchanged.
