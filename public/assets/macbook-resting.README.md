# Compact MacBook render

`macbook-resting.webp` is a transparent 1408 × 560 product render of this v2 site's existing Three.js MacBook, exported locally on 15 October 2026. It is used only below 1200px; compact visitors do not download the renderer or GLB.

The hardware, keyboard, materials, lighting and contact shadow come from `src/home-next/threeHardware.ts`, with the existing `KeyboardTemplate.tsx`. The pose comes from `scenePose(1, 1920, 1080)` and `sceneProjection.ts`: 28° open, −20° pitch, no yaw or roll. It is fitted to a 1280px-wide silhouette inside the image. The dark display artwork reproduces the v2 blue, teal and violet atmosphere with blurred hero copy, using the same `screenPose` counter-projection. The image is a generated product asset, not a cropped review screenshot.

The selected hardware-detail asset retains its provenance in `public/models/README.md`. No new third-party model or image was introduced. Desktop rendering, composition and motion are unchanged.
