# Local MacBook Pro M5 details

`macbook-details.glb` contains selected geometry from Apple’s 14-inch M5 MacBook Pro Quick Look model, fitted to the original Glissform silver laptop. The source package includes Silver and Space Black variants; the conversion selects **Silver**.

- [Source product page](https://www.apple.com/macbook-pro/)
- [Original USDZ](https://www.apple.com/105/media/us/macbook-pro/2025/785e1bc4-d1bd-4cf4-b1b3-94b9411c9e74/ar/macbook-pro-14-in-space-black-variant.usdz)
- Source notice: **Copyright (c) 2025 Apple Inc. All rights reserved.** This notice remains in the GLB.
- Obtained and converted on 2026-10-04 for the owner-authorized local v2 hero.

The five retained mesh parts form the hinge/clutch. The imported keyboard, lettering, Touch ID, lower display plastic, enclosure and screen are excluded. The hinge retains its source pivot placement relative to the deck, with lower mounts fitted inside the original thinner body. Meshoptimizer compresses the selected asset to 87,344 bytes.

`src/home-next/macbook-details.json` contains the small source scoop mesh, fitted to the original 118 × 9 × 4.2 envelope, its matching deck cutout, hinge measurements and source URL. The runtime uses the original silver enclosure and procedural keyboard, with its cached lettering atlas and original recessed Touch ID. The original live HTML hero supplies the screen.

Regenerate on macOS with `npm run prepare:model`. `usdcat` is supplied by macOS; other tools use the project’s pinned dependencies. The source model, full Silver intermediate and other conversion files stay in `/tmp/glissform-m5-model`. Only the selected details and scoop metadata ship with this local candidate.

This provenance note is not a new license or a claim of Apple endorsement. No publication or deployment is performed by the conversion script.
