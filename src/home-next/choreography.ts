import { ease, hardware } from '../hero-test-animation/choreography.ts';
import { textLineDelay } from './textRevealMotion.ts';

export { ease, hardware, screenPose } from '../hero-test-animation/choreography.ts';

const blend = (a: number, b: number, t: number) => a + (b - a) * t;

/** Shared playback speeds for copy triggered by an entrance or scroll event. */
export const timedCopyRevealTiming = {
  headline: 1050,
  subtitle: 900,
  subtitleLag: 80,
} as const;

/** Supporting copy follows the final headline line plus the shared reading
 * lag, expressed as headline progress so each driver keeps its own clock. */
export function subtitleRevealCue(lineCount: number) {
  return textLineDelay(lineCount - 1, lineCount) + timedCopyRevealTiming.subtitleLag / timedCopyRevealTiming.headline;
}

/** Copy starts follow lid clearance; reveal spans keep their original speed. */
export const scrollCopyRevealTiming = {
  headline: { duration: .33, lead: 0, delayMultiplier: 1.02 },
  subtitle: { duration: .24, lead: .0286, delayMultiplier: 1.0404 },
} as const;

export function scrollCopyProgress(progress: number, clearance: number, copy: keyof typeof scrollCopyRevealTiming) {
  const { lead, duration, delayMultiplier } = scrollCopyRevealTiming[copy];
  const start = (clearance - lead / .94) * delayMultiplier;
  return Math.max(0, Math.min(1,
    (progress - start) * .94 / duration));
}

/** The reveal ends with the Mac resting on the surface, 28 degrees open.
 * Fold is measured from the upright (90° open) lid. */
export function scenePose(progress: number, width: number, height: number, openingHeight = height) {
  // The track now ends at the old 94% completion point, without its idle tail.
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * .94;
  const reveal = ease(p / .94);
  const size = Math.min(1.24, width * .62 / hardware.width, height * (height < 640 ? .72 : .80) / 600);
  const close = ease((p - .08) / .86);
  return {
    scaleX: blend(width / hardware.width, size, reveal),
    scaleY: blend(openingHeight / hardware.depth, size, reveal),
    scaleZ: blend(width / hardware.width, size, reveal),
    hingeY: blend(openingHeight, height / 2, reveal),
    x: 0,
    pitch: -20 * reveal,
    yaw: 0,
    roll: 0,
    fold: 62 * close,
    reveal,
    cornerRoundness: 1 - ease(p / .20),
    centerX: width / 2,
    centerY: height * (height < 640 ? .73 : .70),
    navigation: ease((p - .32) / .20),
    screenNavigation: 1,
  };
}
