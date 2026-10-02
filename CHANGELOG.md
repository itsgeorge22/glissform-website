# Changelog

## Unreleased

- Correct the pause/Esc preview's perspective using the MacBook demo's shared wallpaper projection and shader. Narrow the upper edge inside the screen while keeping the bottom edge anchored and the top covered, removing the gap caused by rotating a separate image plane. Preserve wallpaper orientation, the card's viewing angle, pause/return timing and connection glow. Keep a static fallback when graphics are unavailable. Local; awaiting review and publication.

- Replace the Customisable card grid with a spacious Seamless Close feature story and rename the navigation link to Features. Use the shared centered heading/subtitle layout without an eyebrow, remove the numbered labels above the three feature headings, and match section spacing at every width. Add interactive blur comparison, a 20–130° lid-angle preview with automatic-selection demonstration, and pause/Esc desktop-return previews with optional connection glow. Include concise app settings and Connection effect explanations in the initial HTML, with responsive layouts and reduced-motion support. Frame blur and desktop return in matching neutral rounded cards with oversized previews mirrored to opposite edges, blur controls at the lower left and desktop-return buttons beneath Connection effect. Balance both cards with shared padding, height and copy widths, and size and center their images to match the desktop-return content while preserving their perspective. Widen both text columns without closing the text-to-image gap. Keep the Connection effect switch as a preview preference without triggering glow on toggle. Unify pause and Esc previews using one wallpaper that tilts around its bottom edge inside the fixed black screen, restores its perspective and sharpens continuously, eliminating the ghosting caused by crossfading differently projected screenshots. Allow Esc to interrupt the pause, guard active returns from repeated input, cancel pending work when hidden, and smoothly prepare replays instead of snapping back to blur. Keep a soft connection glow and synchronize its peak with the end of the screen movement. Use the site’s glass style for the pause button without an arrow and increase the Connection effect title size. Group the connection-glow toggle with the app’s exact icon and smaller tinted tile inside a Connection effect card. Use matching single-paragraph descriptions for starting angle and desktop return. Remove the dividers around the angle chapter, show only Subtle/Regular/High blur choices, and use the existing site palette for small text and the connection-glow switch. Local; awaiting review and publication.

- Update the public download and software metadata to beta.6. Remove Battery Ripple previews, controls and artwork now that the app focuses on Seamless Close.

- Remove the “More Thoughtful Touches / For Everyday Mac Moments” section from the homepage. Preserve its dot-field animation component, model, styles, fallback artwork, generation script and tests for future reuse.

- Remove the hero feature card and Settings screenshot. Move the existing 3D MacBook heading and description into the hero, leaving the animation and sleep note without a repeated introduction.

- Remove Battery Ripple from website copy, customization controls, preview selection, search metadata and dedicated assets. Balance the four remaining customization cards in two columns.

- Clarify homepage copy and search metadata around MacBook lid-closing, charging and low-battery animations. Add a concise homepage FAQ explaining the iPhone Duo-style visual resemblance and its limits. Keep the website on one page with its existing design, demonstration, canonical URL and sitemap. Publication through the existing website workflow authorized on 2026-10-02.

- Improve initial loading: deliver the existing CSS and exact Inter fonts with the initial page, adjust fallback metrics, add responsive lossless settings/blur previews, and defer MacBook motion loading and offscreen future-field initialization. Preserve page content, settled visuals, animation timing, reduced-motion fallback and direct section links. Repeat local mobile/desktop Lighthouse tests and record their results separately from production. Search Console still reports Couldn't fetch for the sitemap. Publication through the website deployment workflow authorized on 2026-10-02.

- Verify the website's Search Console ownership after owner approval, confirm homepage indexing and matching Google canonical, and submit the public sitemap. Record the live loading measurements and the sitemap processing result separately from successful submission.

- Activate production gzip compression for HTML, JavaScript, CSS and SVG, one-year immutable caching for fingerprinted assets, and revalidation for HTML, discovery files and unfingerprinted assets including the social image. Validate and gracefully reload the server, and verify identical decoded content, conditional cache responses and existing download/update policies. Reduce main JavaScript transfer from 415 KB to 139 KB and CSS from 42 KB to 9 KB.

- Use the exact approved dark social preview artwork, with glow, stars, the refined Glissform wordmark and the pure-white two-line headline “Subtle animations for everyday Mac moments”. Preserve the source PNG unchanged through development and production builds.

- Prerender the full existing marketing page into the production HTML and hydrate its browser interactions. Preserve responsive content, wording, visual layout and direct section links as page geometry settles, with CSS-controlled headline breaks that work before JavaScript loads. Add canonical, Open Graph/Twitter metadata, a matching social image, sitemap/robots files and accurate public-beta `SoftwareApplication` data without invented ratings, reviews or pricing. Prepare restricted receiver support for the two discovery files and verify HTML/assets and deployment archive safety. Install and verify the updated restricted server receiver so automatic deployments accept the discovery files.

- Let the “Before You Try It” headline wrap naturally at every width instead of forcing a line break after “Before”.

- Add the 769–1155px compact layout with desktop navigation, fluid typography and spacing, side-by-side feature choices above a wide preview, and two-column settings, everyday controls, Privacy and FAQ. Enable the scaled MacBook scroll demo throughout this range, preserving reversal and reduced-motion/graphics fallback. Keep the mobile and full desktop layouts, product content and SEO metadata. Add a local compact preview. Verified locally and included in website deployment.

- Position the mobile navigation dropdown directly below the burger button, fit its width to the links and align their right edges.

- Add a fluid single-column website layout for 320–768px with the same desktop product content, headings, image descriptions, FAQ and download links. Keep the existing visual language with a compact single-row header with a burger menu for section links, naturally wrapping text, stacked cards, desktop-matched feature selection states and larger touch controls. Scale the MacBook scroll demo to mobile width/height and retain reversal and reduced-motion/graphics fallbacks. Keep the 1156px desktop layout; the compact layout is tracked separately. The original responsive layout was verified locally; the burger-menu follow-up passes build/source checks, with opening, Escape dismissal/focus return and dropdown alignment verified at 390px. Included in website deployment.

- Reduce website image downloads with lossless WebP screenshots/textures, appropriately sized brand icons and a small favicon. Prioritize the first feature preview, lower the alternate preview's priority and lazily load lower-page images. Keep existing content, layout and animation timing. Generate compressed text assets, serve compression/caching in the local preview and prepare the corresponding production-server configuration; optimized images are included in website deployment.

- Remove CSS corner rounding from brand logos and make navbar and footer shadows follow the transparent logo shape, eliminating the rectangular corner artifact.

- Animate the future-features dot field in a 360px-tall area with 64px of space below the section text, with the earlier left-to-right wave direction, blue shading tied to wave height, and two short diagonal depth fades from opposite corners. The wave keeps its speed and depth on hover while nearby dots lean toward the cursor and brighten; leaving smoothly releases the magnetic response. Preserve dot sizes and spacing, add rows for the taller field and reserve dots beyond every edge, and fade by rendered position to conceal its ends. Remove the oversized focal dot and fixed glow. Pause rendering offscreen, in hidden tabs and below the desktop breakpoint; use a matching static SVG for Reduce Motion or unavailable canvas rendering.

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
