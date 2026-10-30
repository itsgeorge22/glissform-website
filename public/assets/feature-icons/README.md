# Feature copy icons

Unmodified SVG exports from the owner-provided Glissform Figma design (original design reference), retrieved 2026-10-12.

| File | Figma node | Copy block |
| --- | --- | --- |
| login.svg | 220:114 | Start at login |
| menubar.svg | 220:130 | Easy to reach |
| background.svg | 220:142 | Always active |
| updates.svg | 220:149 | Stay updated |

Each export retains its native 48 × 48 dimensions. `src/home-next/SettingsFeatures.tsx` uses the unmodified exports as CSS alpha masks in the existing 40px slots, so their displayed colour inherits the shared primary token instead of the exported fill.

The privacy section reuses `../privacy-shield.svg`, verified byte-for-byte against the export of Figma node `155:425` in the privacy panel (original design reference) on 2026-10-14. Its native 34 × 40 glyph is centered in the design's 48px icon frame and the frame is scaled into the same 40px slot used by the feature icons. The homepage and privacy page use it as the same primary-coloured CSS mask; the SVG file and its geometry are unmodified.
