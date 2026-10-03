# Hero test assets

Source: [New Version, Figma node 132:326](https://www.figma.com/design/IkSrf5xF80j0PeRMzPytZ8/Untitled?node-id=132-326), inspected 2026-10-03.

- `notch.svg`: isolated notch contour and original vector camera from frame artwork (node 132:483), held at 214 × 42 CSS pixels. The screen outline is a separate CSS border with a constant 16px inset and 17px corner radius, so resizing never stretches the notch or lens.
- `glow.webp`: lossless conversion of the exported decorative glow frame (132:150). Retained only as a visual reference; the runtime glow is now three rounded CSS ellipses using the original fills, 60% opacity, bottom/stretch constraints and equivalent 300px/250px CSS blur. Figma’s 600px/500px layer blur exports at half those values as Gaussian standard deviation.
- `menu-bar.svg`: decorative macOS menu-bar instance (132:175), exported as vector outlines at its original 1888 × 48 size, with no embedded raster images. Exported light-colored shadow filters are removed. Only the Apple, Wi-Fi and Control Center icon slots are displayed from this asset; all text is rendered with the system font, and date/time comes from the device clock. The macOS library's Code Connect snippet has no compatible installed React component in this project.
- `glissform.webp`: the source logo image, resized to 128px for its 32px display slots and encoded losslessly.
- `glass-texture.png`: original Figma navigation texture retained as a design reference; the revamped dock uses CSS material styling. Buttons use the existing website textures/components.
- `manrope-400.ttf`, `manrope-500.ttf`, `manrope-600.ttf`, `manrope-700.ttf`: self-hosted Manrope from Google Fonts. See `manrope-license.txt` for the SIL Open Font License.

No temporary Figma URLs are referenced at runtime. These files are imported only by the development test entry and excluded from the normal production build.
