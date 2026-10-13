# Current hero motion reference

This records the implemented Glissform v2 hero settings. Use [Motion guidelines](MOTION.md) to design reusable treatments for other content. The values below preserve this particular composition.

## Screen formation opening

Source: [heroScreenFormation.ts](../src/home-next/heroScreenFormation.ts). This timed, expressive opening treats the screen as one composed unit, with stars resolving as a collection at different apparent depths.

Start with uninterrupted navy. The existing bottom glow expands and rises over 760ms. From 150–650ms, draw the screen inward from the browser edges to its original 16px inset, revealing the black bezel while the corners round to 17px. At 220ms, grow the notch vertically from zero to its full height over 460ms, while bringing it down from 26px above its resting position. Use monotonic easing without a spring, and keep its top behind the moving screen edge so no gap opens.

Stars fade and sharpen at different depths while moving outward from positions 12–20px closer to the center, with less travel near the center. Start one broad outward pulse at 350ms, overlapping the final star arrivals. Run the pulse for 1400ms at a steady outward speed, ending at 1750ms. Use a 130px Gaussian band, up to 16px of radial displacement, 30% enlargement and 2.2× brightness at its crest, with a smooth rise and fade. This wave affects only the stars; it has no separate drawn overlay. Preserve their final positions, twinkle and pointer interactions.

Begin the original content sequence at 600ms, overlapping the final atmospheric settle. The opening and content share one frame clock, starting after fonts are ready. Release the content's entrance styles at its unchanged 1900ms endpoint. [heroPrelude.ts](../src/home-next/heroPrelude.ts) releases all temporary geometry, star styles and the star observer when the pulse ends at 1750ms. The MacBook scroll choreography stays unchanged.

## Timed content entrance

Source: [heroEntrance.ts](../src/home-next/heroEntrance.ts).

| Element | Start | Duration | Initial displacement | Initial scale | Initial tilt |
| --- | --- | --- | --- | --- | --- |
| Headline | 0ms | 1050ms | One line below | 80% | -60°, per line |
| Subtitle | Last headline line + 80ms; currently 122ms | 900ms | One line below | 80% | -60°, per line |
| Menu bar | 0ms | 880ms | 18px above | 100% | 0° |
| Brand | 180ms | 920ms | 16px below | 94% | 0° |
| Download button | 200ms | 1100ms | 36px below | 86% | -10° |
| Navbar | 0ms | 1000ms | 24px below | 98% | 0° |

The headline begins immediately within the content sequence. Calculate the subtitle cue from the final headline line's start, then add 80ms. Whole lines rise, unfold and scale to their normal appearance with 1000px perspective, a 2° initial skew and exponential easing. Line starts are staggered by 4% of the block duration; the final line finishes at the block endpoint. Opacity fades from zero to one during the first 50% of the text block's entrance. Each line starts with an 8px blur on a flat inner span, separate from its 3D transform. Blur clears quadratically with opacity, and filtering becomes none once sharp. All lines finish fading and sharpening at that halfway point, while their movement continues to the original endpoint. Reduced motion keeps text sharp. The treatment is adapted from [Potion's hero](https://sendpotion.com/); timed text uses the original v2 playback speeds.

The menu bar, brand, button and navbar are all composed units using the same object spring. Their damping/frequency settings are menu 8/10, brand 8/11, button 7.8/12.5 and navbar 9/10. Object opacity reaches full visibility during the first 24% of its duration. The menu bar never changes scale; the menu bar and navbar animate as complete objects without item staggers.

All elements settle at their normal position, scale and orientation. The content's spring can briefly pass the final permitted values. Table start times are relative to the content sequence, 600ms into screen formation. Its original 1300ms duration is unchanged; the star pulse finishes at 1750ms and content settles by 1900ms.

## Scroll-controlled copy

The completed scene uses `scrollCopyRevealTiming` in [choreography.ts](../src/home-next/choreography.ts). The headline starts at 1.02 times its lid-clearance progress, adding 2% to the delay before its .33 reveal span in the internal scene coordinate `p`. The subtitle starts at 1.0404 times its adjusted cue, retaining its .24 reveal span. Its existing .0286 lead is applied before that multiplier. `lidClearProgress` in [sceneProjection.ts](../src/home-next/sceneProjection.ts) derives each cue using the same shell projection, scale and vertical placement as the rendered MacBook, recalculating after font loading and viewport changes. These are progress intervals, not seconds or raw page-scroll percentages.

Line rendering is shared through [textRevealMotion.ts](../src/home-next/textRevealMotion.ts). The scroll sequence keeps its own reveal spans and progress control; lid clearance does not introduce a timed pause. Identical progress yields identical text poses in both scroll directions. The opening hero retains its final-headline-line-plus-80ms subtitle cue.

## Navbar visibility

The navbar inside the MacBook stays visible. Only the fixed top navbar uses [navigationScroll.ts](../src/home-next/navigationScroll.ts). It stays shown throughout the pinned MacBook scene, then hides after 80px of downward movement beyond the native sticky-release boundary. Later direction changes use the same 80px downward threshold; 40px upward returns the bar. Moving back into the MacBook scene or focusing a navbar link always shows it. A separate wrapper slides the fixed bar upward over 500ms with a 350ms fade, preserving its entrance and scene transforms. Hidden navigation is inert and excluded from accessibility. Consumed wheel and scroll-key input after release uses the same thresholds without counting native page movement twice. Reduced motion changes visibility immediately.

## Lifecycle

The timed entrance plays once per hero mount. It skips playback for reduced motion, an already-scrolled page or a hidden document. During playback it settles immediately on scrolling, resizing, pointer interaction or keyboard focus within the hero, page hiding or activation of reduced motion. Temporary styles, drawing resources and listeners are cleared on completion or unmount. Reduced motion and no-JavaScript visits retain the complete stationary hero.

Update this reference alongside changes to the corresponding source settings. Documentation-only edits leave the preview unchanged; follow [AGENTS.md](../AGENTS.md) for verification.
