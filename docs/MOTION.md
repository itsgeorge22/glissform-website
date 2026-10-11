# Glissform v2 motion guidelines

Use these rules to choose motion for new v2 content. Classify the element's structure first, then choose its emphasis, amount of movement and timing driver. Exact settings for the existing hero are recorded separately in the [Hero motion reference](MOTION_HERO_REFERENCE.md).

## 1. Choose what moves together

The animation unit follows how the content is perceived. Component names and business roles do not create separate animation families.

| Element type | Animation unit | General treatment |
| --- | --- | --- |
| Reading text | Whole lines within a coherent text block | Use the shared line reveal, preserving line breaks and reading order. Related text blocks can overlap in time. |
| Single visual | The complete visual | Reveal an icon, illustration, image or other visual as one object. Preserve its internal composition. |
| Composed unit | The parent containing related parts | Move a card, bar, button, icon-and-label row or other cohesive group together. Its children retain their positions relative to one another. |
| Collection | Each meaningful item | Reuse each item's text or object treatment. Add a short item stagger only when it helps communicate reading order or relationships. |

The brand and menu bar are both **composed units**. Both use the same object-motion family. Their different widths, placement and emphasis explain their different settings; there is no separate “brand animation” category.

Text inside a control or compact composed unit moves with its parent. The line reveal is for copy the visitor reads as a message. Avoid automatically giving every label, icon and nested container its own entrance.

A collection's item can itself be a composed unit. Animate at the level that makes its structure understandable; do not stack a container entrance, item entrance and individual-child entrance without a clear purpose.

## 2. Choose emphasis independently of type

Use the same motion family with different emphasis:

- **Quiet:** supporting or persistent content. Favor a short translation, modest opacity change and restrained settling. Preserve scale when size changes would make familiar UI feel unstable.
- **Standard:** content that should be noticed and then read. Give it a clear entrance with a soft settle while keeping the composition easy to follow.
- **Accent:** one important action or focal object. A stronger lift, scale change or small tilt can draw attention. Use it selectively so nearby content keeps its hierarchy.

These are design choices, not implemented preset names or a requirement to animate every element. The same type can take different emphasis depending on its job in a section. Equivalent elements in equivalent contexts should use the same settings.

## 3. Calibrate for size, density and placement

- Larger or wider units generally need less travel, scale change and rotation. A small percentage change on a wide surface can create substantial movement at its edges.
- Dense groups of text and controls should remain legible and spatially stable. Prefer translating the group over deforming or independently moving its parts.
- Small isolated visuals have more room for expressive motion, but size alone does not justify stronger emphasis.
- Choose direction from the composition: content can rise into place, and an edge-attached unit can enter from its nearest edge. Keep related units directionally consistent.
- Use the least movement that communicates the intended entrance. Avoid adding translation, scale and tilt automatically to every object.

There is no universal size-to-duration or size-to-scale formula. Start with the closest existing treatment, adjust the parameters needed by the new composition and preserve the shared feel.

## 4. Preserve the shared motion language

**Text** uses whole-line entrances adapted from the opening hero at [Potion](https://sendpotion.com/): a rise from one line below, 3D unfolding, slight scale and skew, and an exponential soft settle. Entrance opacity fades from zero to one during the first 50% of each text block's animation. Every line finishes fading at the block's halfway point; movement continues for the full duration with the same line staggering. Headline and supporting copy share the same treatment. Feature departures play these same line poses backward, including transforms and opacity, with stagger order following the direction of travel; there is no separate parent fade or glide. Lines settle without a spring rebound. Reuse [TextReveal.tsx](../src/home-next/TextReveal.tsx), [text-reveal.scss](../src/home-next/text-reveal.scss) and [textRevealMotion.ts](../src/home-next/textRevealMotion.ts).

**Visuals and composed units** use the existing damped spring family when a moving entrance is appropriate. Opacity increases continuously; position and any permitted scale or tilt settle softly. Choose the amount of movement and rebound through configuration. The current implementation is in [heroEntrance.ts](../src/home-next/heroEntrance.ts).

**Collections** add sequencing to these same treatments. Keep cumulative delay short enough that later items remain readily available. Simultaneous arrival is appropriate when a group should be understood as a whole.

Use shared functions and configuration for repeated behavior. Extract common object-motion code when another actual use needs it; these guidelines do not prescribe a new animation framework.

## 5. Choose the driver and sequence by relationships

### Timed entrances

Use elapsed time for a finite arrival. Important content begins promptly; related elements can overlap. Set delays from a meaningful relationship, such as supporting copy following the start of the final headline line. Preserve the existing hero's agreed cue and speeds in the [reference](MOTION_HERO_REFERENCE.md).

Hierarchy does not require a serial queue. A quiet group can arrive at the same time as expressive text. For a new section, decide which content should lead and which can appear together, then choose local delays. Reuse the grouping and motion rules while configuring timing for that section.

### Scroll-controlled sequences

Use local scroll progress for movement that follows the visitor's gesture. The same progress must produce the same pose when scrolling forward or backward. Related elements use progress intervals, rather than elapsed-time delays.

Copy keeps the shared line treatment under either driver. The opening hero uses `subtitleRevealCue` for its supporting-copy reading cue. The MacBook headline starts just after the lid uncovers its layout position, with a 2% increase to that start delay. Its subtitle uses its own adjusted lid-clearance cue with a 4.04% increase to the start delay. Both cues adapt to viewport fitting; scroll reveal spans remain unchanged, with no timed pause. Exact settings are recorded in the hero reference.

The Settings feature sequence pins one reading-text pair and one visual. Each new scroll gesture triggers exactly one **timed** handoff, then the feature holds until another gesture. Ignore same-direction momentum during playback; never queue advances. Opposite input immediately reverses the current timeline from its rendered position, including repeated reversals, and returns to the corresponding endpoint. Feature headlines and subtitles are one ordered set of lines driven by one reveal controller and one 1050ms timeline. All lines share 64px of travel and one translation progress, independent of font size. Only their unfolding and opacity are staggered, keeping the headline and subtitle together and preserving subtitle line spacing. For both entry and exit, upward movement leads with the top line and downward movement leads with the bottom line; mirror line order with the hidden side so the lower line does not shrink first during an upward exit. There are no independent headline/subtitle clocks. Outgoing copy reverses the line poses at the same speed, with the stagger order selected for its exit side. Direction comes only from the current gesture: down-scroll sends outgoing text upward and brings incoming text upward from below; up-scroll sends outgoing text downward and brings incoming text downward from above. The headline and every supporting line follow that same direction, independent of earlier transitions. The panel slide starts immediately and lasts 1450ms. Outgoing copy starts with the panel. Incoming copy starts exactly when the outgoing copy fully disappears, with no overlap or extra pause; both copy durations remain 1050ms and line motion is unchanged. Panels retain 64px viewport margins at rest. Finish playback only when both the incoming text and panel have settled. Native scrolling continues before the section and at the first/last boundary. Arrow/Page keys and Space provide the same single-step behavior. Timing lives in `settingsFeaturesChoreography.ts`, with shared copy speeds in `timedCopyRevealTiming` in `choreography.ts`. Reduced motion presents all pairs in normal page flow. A visually hidden semantic copy of each message remains in reading order at all times; animated copies are presentational, so screen-reader access never depends on scroll gestures or animation state.

## 6. Keep motion compatible with interaction

- Respect reduced motion and keep content usable in static fallbacks.
- Let user actions take priority over an entrance; do not make people wait for an animation before using a control.
- Release temporary entrance styles on completion so hover, focus and scroll behavior remain independent.
- Clean up frames and listeners on interruption and unmount. Avoid unexpected replay after focus or visibility changes.
- Avoid continuous decorative movement that competes with reading or the next action.

For a new animated section, record its **unit, driver, emphasis, grouping and start relationship**. Then configure the motion from those choices. Keep exact component values in the relevant implementation reference, and keep general rules here. Follow [AGENTS.md](../AGENTS.md) for preview and verification scope.
