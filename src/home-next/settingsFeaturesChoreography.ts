import { ease, timedCopyRevealTiming } from './choreography.ts';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const phase = (elapsed: number, start: number, duration: number) => clamp((elapsed - start) / duration);
const panel = { start: 0, duration: 1450 };
// All headline/subtitle lines share one reveal timeline and its reverse.
const exitCopy = { start: 0, duration: timedCopyRevealTiming.headline };
// Begin the next reveal at the exact end of the outgoing visible fade.
const enterCopy = { start: exitCopy.start + exitCopy.duration, duration: timedCopyRevealTiming.headline };

// A new scroll gesture chooses one adjacent pair; time owns the handoff.
// Copy and panel share a handoff, rather than independently timed arrivals.
export const settingsFeaturesTiming = {
  gestureGap: 280,
  // One headline line of physical travel for every line in the message.
  copyTravelPx: 64,
  exitCopy,
  panel,
  enterCopy,
  duration: Math.max(
    panel.start + panel.duration,
    enterCopy.start + enterCopy.duration,
  ),
} as const;

export function nextSettingsFeature(current: number, direction: number, count: number) {
  return Math.max(0, Math.min(count - 1, current + Math.sign(direction)));
}

export function isNewSettingsGesture(time: number, previousTime: number, direction: number, previousDirection: number) {
  return time - previousTime >= settingsFeaturesTiming.gestureGap || direction !== previousDirection;
}

export function settingsFeaturesPose(elapsed: number) {
  const interval = (timing: { start: number; duration: number }) => phase(elapsed, timing.start, timing.duration);
  return {
    exitCopy: 1 - interval(exitCopy),
    panel: ease(interval(settingsFeaturesTiming.panel)),
    enterCopy: interval(enterCopy),
  };
}
