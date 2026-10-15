# Source artwork

## Social preview

`glissform-social.png` is the owner's approved 4800 × 2520 artwork supplied on 2026-10-14 (the final `codex-clipboard-4eef11a4-806a-417c-845e-968a0f50fed1.png` attachment).

The build downsamples it to a 1200 × 630 PNG at `public/assets/glissform-social.png` for Open Graph previews. No cropping, text replacement or image regeneration is applied. Keep the full-resolution source here.

## Feature demo wallpaper

`feature-wallpaper.png` is the owner's 4480 × 3088 wallpaper supplied on 2026-10-15 as `macos-27-golden-4480x3088-26625.png`. It replaces the earlier Figma desktop wallpaper in both Start at login and Menu bar access at every viewport width.

`scripts/optimize-assets.mjs` generates proportional 960px, 1920px, 2880px and 3840px WebP versions under `src/generated/assets/`, using Sharp quality 85, effort 6 and smart chroma subsampling. `FeatureDesktop.tsx` imports those assets, selects a source for the zoomed demo size and screen density through `srcset`/`sizes`, and defers loading until the demos approach the viewport. Only the generated WebP files are included in the site; the original PNG stays here as the reproducible source.

## Button textures

`button-texture.png` and `try-button-texture.png` retain the original 1024 × 1024 artwork. The build exports their top 320px and 128px respectively as lossless WebP, quality 100 and effort 6. The retained strips are pixel-identical to those regions in the previous full-size WebP files; no resizing, color reduction or alpha quantization is applied.

The shared button styles keep the same top-left position, horizontal repeat, opacity and blend modes. Background widths remain 307.2 and 1024 design pixels, with automatic height preserving the original pixel scale. The strips cover all current button heights, including the 1200px desktop boundary's minimum control sizes. Recheck this coverage if the button height or texture scale changes.
