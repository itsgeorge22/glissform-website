import { ease } from './choreography.ts';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const phase = (elapsed: number, start: number, duration: number) => clamp((elapsed - start) / duration);
const panel = { start: 0, duration: 1450 };
// All headline/subtitle lines share one reveal timeline and its reverse.
const copyDuration = 900;
const exitCopy = { start: 0, duration: copyDuration };
// Begin the next reveal at the exact end of the outgoing visible fade.
const enterCopy = { start: exitCopy.start + exitCopy.duration, duration: copyDuration };

// A new scroll gesture chooses one adjacent pair; time owns the handoff.
// Copy and panel share a handoff, rather than independently timed arrivals.
export const settingsFeaturesTiming = {
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

export function settingsFeaturesPose(elapsed: number) {
  const interval = (timing: { start: number; duration: number }) => phase(elapsed, timing.start, timing.duration);
  return {
    exitCopy: 1 - interval(exitCopy),
    panel: ease(interval(settingsFeaturesTiming.panel)),
    enterCopy: interval(enterCopy),
  };
}
