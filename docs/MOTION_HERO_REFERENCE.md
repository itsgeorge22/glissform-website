# Current hero motion reference

This records the implemented Glissform v2 hero settings. Use [Motion guidelines](MOTION.md) to design reusable treatments for other content. The values below preserve this particular composition.

## Timed entrance

Source: [heroEntrance.ts](../src/home-next/heroEntrance.ts).

| Element | Start | Duration | Initial displacement | Initial scale | Initial tilt |
| --- | --- | --- | --- | --- | --- |
| Headline | 0ms | 1050ms | One line below | 80% | -60°, per line |
| Subtitle | Last headline line + 80ms; currently 122ms | 900ms | One line below | 80% | -60°, per line |
| Menu bar | 0ms | 880ms | 18px above | 100% | 0° |
| Brand | 180ms | 920ms | 16px below | 94% | 0° |
| Download button | 550ms | 1100ms | 36px below | 86% | -10° |
| Navbar | 0ms | 1000ms | 24px below | 98% | 0° |

The headline begins immediately. Calculate the subtitle cue from the final headline line's start, then add 80ms. Whole lines rise, unfold and scale to their normal appearance with 1000px perspective, a 2° initial skew and exponential easing. Line starts are staggered by 4% of the block duration; the final line finishes at the block endpoint. Opacity fades from zero to one during the first 50% of the text block's entrance. All lines finish fading at that halfway point, while their movement continues to the original endpoint. The treatment is adapted from [Potion's hero](https://sendpotion.com/); timed text uses the original v2 playback speeds.

The menu bar, brand, button and navbar are all composed units using the same object spring. Their damping/frequency settings are menu 8/10, brand 8/11, button 7.8/12.5 and navbar 9/10. Object opacity reaches full visibility during the first 24% of its duration. The menu bar never changes scale; the menu bar and navbar animate as complete objects without item staggers.

All elements settle at their normal position, scale and orientation. The spring can briefly pass the final permitted values. Start times are relative to the entrance's first animation frame after fonts are ready; the sequence settles by 1650ms.

## Scroll-controlled copy

The completed scene uses `scrollCopyRevealTiming` in [choreography.ts](../src/home-next/choreography.ts). The headline starts at 1.02 times its lid-clearance progress, adding 2% to the delay before its .33 reveal span in the internal scene coordinate `p`. The subtitle starts at 1.0404 times its adjusted cue, retaining its .24 reveal span. Its existing .0286 lead is applied before that multiplier. `lidClearProgress` in [sceneProjection.ts](../src/home-next/sceneProjection.ts) derives each cue using the same shell projection, scale and vertical placement as the rendered MacBook, recalculating after font loading and viewport changes. These are progress intervals, not seconds or raw page-scroll percentages.

Line rendering is shared through [textRevealMotion.ts](../src/home-next/textRevealMotion.ts). The scroll sequence keeps its own reveal spans and progress control; lid clearance does not introduce a timed pause. Identical progress yields identical text poses in both scroll directions. The opening hero retains its final-headline-line-plus-80ms subtitle cue.

## Navbar visibility

The navbar inside the MacBook stays visible. Only the fixed top navbar uses [navigationScroll.ts](../src/home-next/navigationScroll.ts). It stays shown throughout the pinned MacBook scene, then hides after 80px of downward movement beyond the native sticky-release boundary. Later direction changes use the same 80px downward threshold; 40px upward returns the bar. Moving back into the MacBook scene or focusing a navbar link always shows it. A separate wrapper slides the fixed bar upward over 500ms with a 350ms fade, preserving its entrance and scene transforms. Hidden navigation is inert and excluded from accessibility. Consumed wheel and scroll-key input after release uses the same thresholds without counting native page movement twice. Reduced motion changes visibility immediately.

## Lifecycle

The timed entrance plays once per hero mount. It skips playback for reduced motion, an already-scrolled page or a hidden document. During playback it settles immediately on scrolling, keyboard focus within the hero, page hiding or activation of reduced motion. Temporary styles and listeners are cleared on completion or unmount.

Update this reference alongside changes to the corresponding source settings. Documentation-only edits leave the preview unchanged; follow [AGENTS.md](../AGENTS.md) for verification.
