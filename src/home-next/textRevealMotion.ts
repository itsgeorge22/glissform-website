const clamp = (value: number) => Math.max(0, Math.min(1, value));
const expoOut = (value: number) => value === 0 || value === 1 ? value : 1 - 2 ** (-10 * value);

/** All entering lines finish fading here, while movement continues to settle. */
export const textFadeEnd = .5;
const revealBlurPx = 8;

/** Shared sharpening curve for reading text and its accompanying feature icon. */
export const revealBlurFilter = (opacity: number) => opacity === 1 ? 'none'
  : `blur(${(revealBlurPx * (1 - opacity) ** 2).toFixed(3)}px)`;

export function textLineDelay(index: number, count: number) {
  return count > 1 ? Math.min(.04, .2 / (count - 1)) * index : 0;
}

/** Entrances unfold and settle. Direction mirrors a feature's panel travel;
 * scroll-driven callers still scrub the unchanged default pose in reverse. */
export function textLinePose(progress: number, index: number, count: number, direction = 1) {
  const delay = textLineDelay(index, count);
  const span = 1 - textLineDelay(count - 1, count);
  const local = clamp((progress - delay) / span);
  // Keep line starts staggered, but finish every fade halfway through the block.
  const fade = clamp((progress - delay) / (textFadeEnd - delay));
  const remaining = 1 - expoOut(local);
  return {
    opacity: fade,
    y: direction * 100 * remaining,
    tilt: direction * -60 * remaining,
    skew: direction * 2 * remaining,
    scale: 1 - .2 * remaining,
  };
}

export function createTextReveal(element: HTMLElement, options: { travelPx?: number; directionalStagger?: boolean } = {}) {
  const lines = Array.from(element.querySelectorAll<HTMLElement>('.text-reveal__content'));
  let previousProgress: number | undefined, previousDirection: number | undefined;
  return (progress: number, direction = 1) => {
    // A reduced-motion reset removes styles; invalidate the cached pose then.
    if (progress === previousProgress && direction === previousDirection && lines[0]?.style.opacity !== '') return;
    // A mixed-size message can share its physical travel while each line keeps
    // the established staggered unfolding and fade. Hero/Mac callers retain
    // their existing line-relative travel by omitting this option.
    const sharedY = options.travelPx === undefined ? undefined
      : textLinePose(progress, 0, 1, direction).y * options.travelPx / 100;
    lines.forEach((line, index) => {
      // Mirror the line order with the hidden side, too. Reversing a reveal
      // above the resting position must fold the top line first; keeping DOM
      // order here would make the bottom line shrink first while travelling up.
      const poseIndex = options.directionalStagger && direction < 0 ? lines.length - 1 - index : index;
      const pose = textLinePose(progress, poseIndex, lines.length, direction);
      line.style.opacity = String(pose.opacity);
      // Sharpen during the fade, then remove filtering while the line settles.
      // Using the same pose keeps blur continuous on scroll/gesture reversal.
      line.style.setProperty('--text-reveal-filter', revealBlurFilter(pose.opacity));
      const y = sharedY ?? pose.y;
      const settled = y === 0 && pose.tilt === 0 && pose.skew === 0 && pose.scale === 1;
      line.style.transform = settled ? 'none'
        : `translate3d(0, ${y}${sharedY === undefined ? '%' : 'px'}, 0) rotateX(${pose.tilt}deg) skewY(${pose.skew}deg) scale(${pose.scale})`;
    });
    previousProgress = progress; previousDirection = direction;
  };
}
