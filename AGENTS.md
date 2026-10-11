# Glissform website v2 working rules

## Scope and authority

- Work in `/Users/george/Projects/glissform-website-next`. These rules apply to the website, not the native app.
- Leave v1 at `/Users/george/Projects/glissform-website` and the public website at glissform.app untouched unless the owner explicitly authorizes work there.
- Do not push, upload, deploy, or publish without authorization for that action. A push to `main` triggers production deployment; treat it as publication.
- These owner-approved website rules replace the earlier requirements to maintain README, CHANGELOG and ROADMAP for every task and to run builds/tests after small UI changes. Builds needed to update the preview remain part of the workflow.

## Visual consistency

- V2 is the sole visual reference. Preserve and extend its established appearance; do not import design decisions, styles, layouts or components from v1 unless explicitly requested. Existing helpers already used by v2 may remain; their origin does not make v1 a design reference.
- Preserve established typography, colors, materials, spacing, radii and motion unless the requested change alters them.
- Matching elements and equivalent locations must share consistent rules. Inspect affected peers and apply a shared change across the whole relevant surface.
- Use shared components, styles and values for repeated patterns. Explicit new owner decisions supersede earlier visual choices.
- Use [docs/MOTION.md](docs/MOTION.md) for reusable motion rules: classify reading text, single visuals, composed units or collections; choose emphasis independently, calibrate for size and keep timed and scroll-controlled sequencing separate. Brand groups, bars, cards and controls can share the composed-unit treatment; do not create an animation family for each component name. Keep exact hero settings in [docs/MOTION_HERO_REFERENCE.md](docs/MOTION_HERO_REFERENCE.md). The completed MacBook scroll animation is outside entrance refinements unless explicitly requested.
- Keep the website at widths of **1056px and wider** and the existing placeholder **below 1056px**. Do not introduce additional breakpoints, mobile/compact layouts or alternate responsive designs yet. Preserve existing desktop fitting behavior.

## Code structure

- Copy entrances share the same whole-line rise, 3D tilt, scale and easing. Feature headlines and subtitles use one shared line-reveal controller and timeline, with the line stagger following travel: top to bottom when moving up, bottom to top when moving down, for both entry and exit. All feature lines share one physical travel distance and translation progress so headline size cannot stretch their spacing; retain line-by-line unfolding and fading. Reverse an active handoff continuously when scroll direction changes, without jumping or queueing another feature. Exits reverse the shared line poses, including tilt, scale, skew and opacity, with stagger order mirrored for the exit side. Direction always follows the current gesture: scrolling down moves all outgoing and incoming text upward; scrolling up moves all of it downward. Never derive direction from an earlier entrance. Do not substitute a block translation or fade. The opening hero uses `subtitleRevealCue` for its reading cue; the scroll-controlled MacBook headline starts 2% later than its lid-clearance cue, and the subtitle starts 4.04% later than its adjusted lid-clearance cue.
- For scroll-controlled copy, preserve reveal spans and exact reverse-scroll behavior. Keep those values in `scrollCopyRevealTiming` in `src/home-next/choreography.ts`, and derive each copy block's start from viewport-fitted lid geometry in `sceneProjection.ts`; do not convert them into entrance delays.
- For time-controlled copy, derive related text-block starts from reading cues and shared line staggering. Preserve the existing hero's immediate headline, final-line-plus-80ms subtitle cue and 1050ms/900ms reveal speeds unless explicitly asked to change them. New compositions use the general motion guidelines to define their own sequence.
- Keep the navbar inside the MacBook visible. Only the fixed top navbar hides on scroll: count 80px downward after the MacBook's native sticky release, return after 40px upward, and keep it shown throughout the pinned MacBook scene.

- Use clear names and folders organized by responsibility. Separate UI components, styling, animation/rendering logic and utilities where that improves clarity.
- Reuse components and shared logic for repeated behavior; keep one source of truth for shared values. Avoid redundant markup, duplicate logic and conflicting style overrides.
- Prefer the straightforward solution. Fix the underlying cause instead of stacking patches, special cases or workarounds when a direct approach exists.
- Keep abstractions proportional to the task. Do not split every small fragment into a component, invent unnecessary frameworks or perform unrelated refactoring.
- Preserve existing user work, accessibility, reduced-motion behavior, graphics fallbacks and animation cleanup unless the requested change explicitly affects them.
- Keep generated builds, dependencies, caches, screenshots and credentials out of Git. Retain asset provenance and license notices.

## Preview and verification

- After every website change, update the local preview at `http://127.0.0.1:4180/` so the owner can see the latest result. It serves built output: rebuild when source/assets change, start or restart the preview if needed, and reload the page. Do not claim it is updated without confirming the changed result is served.
- Documentation-only edits do not change the rendered website and do not require a rebuild or server restart; say that the preview is unchanged.
- Do not routinely run automated tests after small visual, copy, spacing or styling edits. The owner reviews the visible result; use a targeted visual check only when needed for a concrete problem or requested review.
- Run the appropriate build and relevant checks before an authorized push or upload. Test earlier only when explicitly requested or needed to investigate a concrete functional problem. Do not repeatedly run full suites after minor adjustments.
- A build needed to refresh the preview is separate from a regression test run. The current `npm run build` also includes Astro type checking; that does not require running additional test suites.
- For documentation-only publication, check changed text, local links and formatting; no website build or animation tests are needed solely for documentation.
- Report verification accurately. Automated checks and callback measurements are not proof of physical-device animation smoothness. After authorized publication, verify the deployed result before claiming success.

## Documentation and communication

- Keep README short and practical: purpose, setup, preview, key source locations and local/production boundaries. Update it only when those facts change.
- Keep CHANGELOG as a concise record of meaningful completed work. Group related refinements; avoid a diary of every small tweak, test run or abandoned experiment. Distinguish local/unpublished work from published changes and preserve historical entries.
- Do not maintain a ROADMAP. Files in `docs/archive/` are historical references, not current rules or an active task queue; no ongoing updates are required.
- Update asset provenance notes only when asset sources, conversion steps or usage change.
- Summarize what changed, whether the preview is current, relevant verification and anything still unpublished. Do not add repetitive documentation or public-metadata reviews for every small visual edit.
- Keep website product, privacy, compatibility and download claims accurate when editing them. Glissform is the broader product; Seamless Close is a feature. Do not announce unapproved future features or imply unpublished work is live.
