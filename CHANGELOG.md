# Changelog

## Unreleased

- Reduce primary download button scaling to 1.008 on hover and 0.985 on press, retaining the smooth timing, rebound and visual styling. Navbar motion is unchanged.

- Soften the end of both download buttons’ hover, press and return motion with longer settling tails and a gentler rebound. Preserve their movement distances, final scale and visual styling.

- Match primary download buttons to the navbar button’s hover lift, press compression and springy return. Share the lift, timing and easing, with more restrained primary scaling, while preserving the primary button’s shadows, colors, borders and shimmer.

- Restart the primary download button’s shimmer on release while still hovered, matching the secondary button.

- Remove the navbar download button’s icon and fit its width to the centered label with 16px padding on each side, preserving its glass interactions.

- Give the navbar download button a glass reflection that follows the pointer, a lit rim, a gentle tilt and an entry light sweep. Compress the glass with inset shading on press and a soft rebound on release. Keep the clickable area fixed, preserve keyboard focus feedback and disable decorative motion with Reduce Motion.

- Remove the small availability note below the hero download button.

- Smooth the primary button shimmer with a 650ms eased sweep that begins at the left edge immediately on hover, without a fade-in delay, and finishes beyond the right edge. Restart each hover from the beginning.

- Capitalise each word in the lid-reveal headline: “A Little Magic / Every Time You Close”.

- Refine primary download button feedback with a gentle lift and a brighter, wider light sweep on hover, followed by a small compression on press. Use 180ms press movement and 150ms ease transitions for the other visual feedback. Expand the blue glow on hover, remove the outer shadow and white border while pressed, retain the inner highlight and smoothly restore the glow on release. Disable movement and the light sweep with Reduce Motion.

- Align the “Feels At Home” card titles with Figma: “Start at login”, “Settings, close by”, “Keep effects ready” and “Update your way”. Keep the matching descriptions.

- Add softly dispersed aurora light and 40 drifting stars in varied sizes to the download card. Nearby stars move toward the cursor and brighten. Pause decorative motion offscreen and in hidden tabs and respect Reduce Motion.

- Redesign the final download card with a deep navy background, soft blue glow and pure-white “A Little More Magic” headline. Use a quiet brand row, a larger headline with narrower feature copy, and 32px/16px/32px spacing to establish a clear hierarchy above the shared primary button. Omit small text below the button and the curved bottom line.

- Refine the future-features headline to “More Thoughtful Touches / For Everyday Mac Moments”.

- Combine the strongest Figma and website copy with clear feature descriptions, beta requirements and installation guidance. Use single-sentence or single-phrase headlines without final periods, at most two lines and a shorter first line. Use title case for section headlines and the lid-reveal message; use sentence case for buttons and other copy, preserving proper names.

- Remove the Esc instruction from the Seamless Close website footnote, leaving “Normal system sleep stays enabled.”

- Increase the gap between the Seamless Close subtitle and MacBook model to 64px, matching the Customisable section.

- Fix angle-dependent softness and edge spill on the MacBook deck, bezel and outer lid using shared rounded geometry, opaque surface padding and anisotropic texture filtering. Composite the screen and notch into the opaque lid to eliminate transparent seams; preserve intentional wallpaper blur and motion.

- Establish and verify a private website repository and GitHub Actions production deployment, preserving downloads and updates.
- Include the approved single-canvas MacBook animation, headline polish and existing website design.
