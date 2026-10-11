> Archived on 2026-10-05. Historical evidence only; not a current specification, task list, or authorization to publish. No ongoing maintenance required.

# Local hero migration validation — 2026-10-04

Scope: the isolated hero-only candidate in `glissform-website-next`, branch `codex/homepage-v2`. No lower sections are mounted or implemented in the new page. The original v1 checkout and public website remain outside this task. This pass also adds a local prepared model, its conversion script, and focused asset tests.

## Current Safari screen-layer correction

- Reproduced the reported upper-left shrink in the existing Safari localhost tab: the physical Mac remained correctly sized while its blurred live content occupied only part of the screen. Chromium did not reproduce it at the checked widths.
- Move the single animated blur to a flat, composited content child, leaving the projective transform on its parent. Keep the original screen projection, camera, lid choreography, pointer mapping and blur values unchanged.
- After rebuilding and refreshing Safari, the previously broken partially closed pose fills the screen correctly with blur active. The early reveal and reverse return to the opening were also checked visually. This is a targeted Safari rendering check, not a performance benchmark or blanket browser-compatibility claim.
- Build and all 28 existing focused checks pass (12 hardware, 10 shared animation, 6 generated-page). README, CHANGELOG and ROADMAP were updated. The preview was refreshed, temporary Chromium viewport overrides were reset, and all changes remain local to v2.

## Earlier desktop-only boundary and shared typography

- Widths below 1056px now show only “A little more room, please.” and the preview instruction. CSS hides the desktop scene before hydration; the viewport subscription unmounts it afterward, including its fixed navbar and empty continuation. The previous compact typography and layout overrides were removed.
- Both scene headlines share Manrope 600 at 64/72px with −0.04em tracking. Both subtitles share Manrope 400 at 18/28px with normal tracking. The second scene retains #090b0e and #555b63 and its character animation.
- Production build and six generated-page checks pass. In the local browser, 1055 × 850 showed only the placeholder, no mounted desktop scene, and no excess scroll height. Resizing to 1056 × 850 restored the desktop experience; computed typography matched between the two scenes and the ending was checked visually. Returning to 1055px removed the scene and fixed navbar. No runtime errors or warnings were recorded, and the temporary viewport override was reset.
- README, CHANGELOG and ROADMAP were reviewed and updated. Product claims and public destinations remain unchanged. Nothing was published and v1 was not modified.

## Earlier reference-layout and navigation validation

- The outside page is pure white. The centered ending uses “Satisfying even when / it’s time to close” in two equal black lines and the original two-line hero subtitle. The original silver materials, keyboard, lighting and partially open pose are retained; no model assets changed in this pass.
- Heading and subtitle characters reveal in reading order with reversible opacity, vertical movement and a small unfolding rotation. Complete accessible labels preserve whole phrases. The original monotonic projected-center path remains, ending 28° open with an 18° turn and 4° roll.
- The matching outside navbar enters with a fade, downward slide and slight scale, then stays fixed 24px from the viewport top, including across the empty continuation. Its dock has no box shadow, a blue gradient at 72% and 66% opacity, and a verified 24px backdrop blur. The standard and Safari blur properties are supplied directly to prevent CSS optimization from dropping the standard property. The original screen navbar fades out during the handoff and returns on reversal; the hidden navbar is inert.
- Astro checking and the production build pass. All 28 focused checks pass: twelve hardware/display/character checks, ten shared motion/pointer/scheduling checks and six generated-page checks. Character coverage includes bounds, reading order, monotonic reveal and exact reversal. The existing bundle-size advisory remains.
- The local production preview was checked at an actual viewport of 1305 × 1016. At the ending, all characters resolve to full opacity, the fixed dock has `box-shadow: none`, and Chromium computes `blur(24px) saturate(1.35)`. During reverse scrolling, characters have staggered opacities in reading order. After scrolling into the empty continuation, the stage is completely above the viewport and the visible, interactive navbar remains at 24px. No runtime warnings or errors were recorded. Stationary compact/reduced-motion/graphics fallbacks still hide the outside scene and navigation; no new native Safari or system Reduced Motion test is claimed.
- README, CHANGELOG and ROADMAP were reviewed and updated. Existing product claims and link destinations remain unchanged. Everything is local to v2; v1, GitHub and glissform.app were not modified.

## Earlier centered light-scene validation

- The page, stage and empty continuation use a light `#f5f6f8` background. The original screen hero stays dark, including its existing atmosphere, content and controls. The original keyboard and plain lower display edge remain; no model assets or materials changed in this pass.
- The ending contains only the centered headline “You’ve closed it a thousand times. Never like this.”, its supporting subtitle and the Mac. There is no button, eyebrow, circular decoration, angle readout, annotation or added glow.
- The Mac makes one continuous centered pullback and turn, ending 28° open with an 18° turn and restrained 4° roll. Framing interpolates a single projected silhouette center instead of first recentering upward and then moving down for the title. The track is 3.4 viewports tall with a 2300px minimum; scroll smoothing is 65ms. The headline and subtitle reveal after the lid clears their space.
- Astro checking and the production build pass with zero type errors. All 27 focused checks pass: eleven hardware/display, ten shared motion/pointer/scheduling and six generated-page checks. The framing test samples every percent of travel at seven sizes, including 1280 × 460 and 952 × 1001, and verifies no directional reversal, horizontal centering, final fit, physical-display alignment and reverse projection. Generated HTML checks cover the accepted copy, light theme and absence of the removed decorations/controls. The existing bundle-size advisory remains.
- The local production preview was visually checked at 1280 × 720 and in the resized 1305 × 1016 window. The heading and subtitle stay centered above the Mac. Forward scrolling releases the scene into a completely empty light viewport; reverse scrolling restores the original untransformed hero with no closing blur and a hidden hardware canvas. No runtime errors or warnings were recorded. Temporary viewport overrides were cleared. The compact and reduced-motion stationary fallback behavior is preserved; no new native Safari or reduced-motion preference test is claimed.
- README, CHANGELOG and ROADMAP were reviewed and updated. Existing product availability, download destinations and public metadata remain accurate and unchanged. All work is local in v2; v1, GitHub and the published site were not modified.

## Earlier minimal-ending validation

- Astro TypeScript check and production build pass, with no type errors. The deferred renderer is about 664 KB minified / 169 KB gzip; the existing size advisory remains. Removing the rectangular screen light also removes its lookup data from the bundle.
- All 27 focused checks pass: eleven hardware/display checks, ten shared motion/pointer/scheduling checks and six generated-page checks. Coverage includes the original Touch ID well, absence of imported keyboard/plastic meshes, scoop size, hinge clearance, original shell/aperture, 30° opening limit, final headline clearance, ending phase continuity, opening fit and forward/reverse display projection.
- The 87,344-byte runtime detail asset contains only five hinge/clutch meshes. The original keyboard, lettering atlas, recessed Touch ID and plain lower display edge are restored. The Pro scoop and hinge placement remain. The added screen-light emitter and stage glow are removed; the original screen hero's atmosphere remains.
- The desktop ending reveals “A calmer way to close.” in two gently resolving lines while the Mac scales down and settles beneath it. Its lid stops 30° open. Scrolling past the completed composition releases the whole sticky stage into normal page flow. The reserved continuation is exactly one empty viewport with no new section content.
- In the local in-app browser, the opening, closing composition, complete exit into the blank area and reverse scroll were checked. At the blank continuation, the 720px stage is entirely above the viewport (top −720, bottom 0), and the empty area fills the viewport. The original opening restores without a screen transform or blur. At 390 × 844, the stationary hero retains its controls with no horizontal overflow or extra scroll space; the ending and continuation are hidden. The temporary viewport override was reset. No runtime errors or warnings were recorded.
- README, CHANGELOG and ROADMAP were reviewed and updated for the restored details and new ending. Product availability and existing public links remain unchanged. No v1 edits, pushes, GitHub updates, releases or deployments were made. Native Safari/Chrome owner acceptance remains pending; these checks are not a displayed-FPS benchmark.

## Earlier Pro-keyboard / screen-glow iteration

The prior hybrid model used a 361,636-byte asset with imported keys and lower display plastic, plus a screen-light emitter and outer glow. Those details and the extra lighting have now been removed at the owner's request. The original-sized Pro scoop and fitted hinge remain.

## Earlier full M5 model evaluation

The complete imported Silver M5 was previously prepared as a 1,994,896-byte asset from a 163,918-triangle source and checked at the opening, full closure and reopening. It has since been replaced at the owner's request by the original body with selected Pro details. Full-model notch/aperture and complete-closure results describe that earlier evaluation, not the later hybrid model's partially open stopping poses.

## Earlier procedural-model validation

The observations below describe the earlier hand-built model and its refinements. The original shell geometry is restored in the current version, with the original keyboard, retained Pro hinge/scoop details and a different stopping pose. The older generated keyboard atlas, geometry counts and callback measurements do not describe the current hybrid model.

## Browser observations

The Touch ID and front-edge refinement was checked in the local production preview at 1178×1016. The black sensor sits within a shallow circular key recess. The front scoop has flat machined faces and sharp angled ends; analytic front-wall normals remove the earlier rippled reflections. The open, closed and reverse-scroll poses were checked, with no runtime warnings or errors recorded. Returning to the opening preserves the square black boundary, 16px padding, and untransformed, unblurred live hero. The build and eight hardware/display checks pass. README and CHANGELOG describe the refinement; ROADMAP's owner-review and publication gates remain accurate. No new performance benchmark or standalone Safari/Chrome acceptance is claimed.

The latest 10% reduction sets the top inset to 16.65 units and both sides to 14.4 units, preserving their ratio and the 32-unit lower border. The build and six hardware/display checks pass. The opening, revealed laptop and reverse scroll were checked in the local preview at 1178×1016. The cropping assertion now applies to wider desktop views; near the 900px compact boundary the thinner physical case can fit inside the viewport, while the opening projection still preserves the exact 16px HTML frame. README and ROADMAP remain accurate; CHANGELOG records the local refinement.

The top-bezel optical correction uses a fixed 18.5-unit top inset with the existing 16-unit sides and 32-unit lower inset. The supplied 3838×2028 screenshot showed a 53–54px top strip against 61–63px sides. At the corresponding 1919×1014 browser viewport and an early pullback pose, the updated browser screenshot has approximately 29–30px top and side strips (captured at a different pixel density). The build and six hardware/display checks pass; returning to the opening retains the original frame. README and ROADMAP remain accurate, and CHANGELOG records the local adjustment.

The subsequent small bezel adjustment reduces the top and both sides from 18 to 16 model units (about 11%) while retaining the 32-unit lower border. The production build and six hardware/display checks pass. The revealed display and reverse scroll were checked in the local in-app browser; the stationary hero retains its 16px padding. README and ROADMAP remain accurate, and CHANGELOG records the local refinement.

The fixed-bezel pass checked the production preview at the opening, 3.6% progress, immediately before and after the former 13% layer-switch boundary, the exposed keyboard, partial closure, full closure, and reverse scrolling. The notch retained its local 214×42 size and translation throughout, shrinking only with the shared screen projection. The screen inset had no animated transform. The base remained in front of the lower rim as it appeared; there was no overlay removal at 13%. Returning to zero restored a black square outer boundary, 16px padding, no screen/desktop transform or blur, and a hidden hardware canvas. These observations use the local in-app browser at 1280×720; a later window resize to 1178×1016 also preserved the reveal and restored opening. No runtime warnings or errors were recorded. Native Safari/Chrome owner acceptance remains pending. README and CHANGELOG were updated, and ROADMAP's review/publication boundaries remain accurate.

The later lowered-lid and keyboard pass verified the opening without white corner cutouts, the open lid seated against the base, legible correctly oriented key markings, and full closure/reopening in the local production preview. No runtime errors were recorded in that pass. Geometry checks cover the lowered assembly through closure, including the requirement that no lid or hinge part extend beneath the body. README and CHANGELOG were updated; ROADMAP's owner-review gate remains accurate. Native Safari/Chrome acceptance is still separate.

After the bezel/hinge refinement, the production preview was checked at the opening, revealed, partially closed and fully closed poses, then scrolled backward to the opening. The display has rounded top corners and square lower corners; the outer aluminium case retains rounded corners to match the base when closed. The lid and rear deck meet through the dark hinge assembly. At the restored opening, computed frame padding is 16px, aperture transform is `none`, desktop filter is `none`, and the hardware canvas is hidden. README and CHANGELOG were updated; ROADMAP's pending owner-review gate remains accurate. The callback timing sample below predates this geometry refinement.

The local Chromium-based in-app browser showed the hero-only production build at 1280×720 and the compact hero at 390×844. The desktop opening retains its live content, glow, stars, clock, navbar and buttons. Forward scrolling reveals the metal laptop and closes its lid; reverse scrolling reopens the same display. The settled closed display is hidden/inert, and the return control appears. The lid mark's orientation and the dark key material were checked visually. The compact hero remains stationary with visible controls and no horizontal overflow at the checked width.

The development diagnostics successfully forced graphics context loss: the hero became stationary with no surface transform, no closing filter and no visible hardware canvas. The hero remains usable. Reduced-motion guards are present in code/CSS; a native operating-system preference change was not part of this browser pass.

One local development callback sample at 1280×720, DPR 2, used a three-second idle interval followed by a nine-second close/reopen cycle:

| Sample | Callbacks | Median interval | 95th percentile | Maximum | Intervals >25 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Opening | 180 | 16.7 ms | 17.6 ms | 17.7 ms | 0 |
| Close/reopen | 541 | 16.7 ms | 17.6 ms | 17.7 ms | 0 |

No Long Task or Long Animation Frame entries were reported in that sample. These numbers measure callback spacing, not displayed FPS. This was not a standalone Safari/Chrome device benchmark, and it does not guarantee smoothness on every machine. The original study's older measurements used a different viewport and are not a controlled comparison with this sample.

## Isolation and publication

The canonical checkout retained its original HEAD, short Git status and all 116 source-file hashes from the pre-migration snapshot. No pushes, releases, server edits or deployments were made. README, CHANGELOG and ROADMAP were reviewed and updated only in this candidate. Public product/availability facts remain the existing ones; GitHub and the live homepage were not updated. Owner visual/performance acceptance in Safari and Chrome remains pending before any replacement decision.
