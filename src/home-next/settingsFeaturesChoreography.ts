import { ease } from './choreography.ts';
import { springDisplacement } from './objectMotion.ts';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const phase = (elapsed: number, start: number, duration: number) => clamp((elapsed - start) / duration);
const panel = { start: 0, duration: 1150 };
// All headline/subtitle lines share one reveal timeline and its reverse.
const copyDuration = 700;
const exitCopy = { start: 0, duration: copyDuration };
// Begin the next reveal at the exact end of the outgoing visible fade.
const enterCopy = { start: exitCopy.start + exitCopy.duration, duration: copyDuration };

// A new scroll gesture chooses one adjacent pair; time owns the handoff.
// Copy and panel share a handoff, rather than independently timed arrivals.
export const settingsFeaturesTiming = {
  // One headline line of physical travel for every line in the message.
  copyTravelPx: 64,
  upwardIconLeadMs: 100,
  exitCopy,
  panel,
  enterCopy,
  duration: Math.max(
    panel.start + panel.duration,
    enterCopy.start + enterCopy.duration,
  ),
} as const;

// Keep the first entrance from the Mac scene independent of faster handoffs.
export const settingsFeatureEntranceTiming = { copy: 900, panel: 1200, duration: 1200 } as const;

/** A large panel needs only a small rise and scale change, with a quiet spring. */
export function settingsFeatureEntrancePose(elapsed: number, coverage = 1) {
  const copy = Math.min(clamp(elapsed / settingsFeatureEntranceTiming.copy), coverage);
  const panel = Math.min(clamp(elapsed / settingsFeatureEntranceTiming.panel), coverage);
  const remaining = springDisplacement(panel, 9, 7);
  return { copy, y: 40 * remaining, scale: 1 - .025 * remaining, opacity: ease(panel / .45) };
}

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

/** Pack the changing panel heights edge-to-edge, retaining the 24px gap. */
export function settingsFeaturePanelPoses(position: number, count: number, height: number, entranceScale = 1) {
  const gap = 24;
  const compressedScale = .7;
  const scales = Array.from({ length: count }, (_, index) =>
    1 - (1 - compressedScale) * Math.min(1, Math.abs(index - position)));
  const centers = [0];
  for (let index = 1; index < count; index++) {
    centers[index] = centers[index - 1]
      + height * entranceScale * (scales[index - 1] + scales[index]) / 2 + gap;
  }
  const before = Math.floor(position), after = Math.min(count - 1, before + 1);
  const anchor = centers[before] + (centers[after] - centers[before]) * (position - before);
  return scales.map((scaleY, index) => ({ y: centers[index] - anchor, scaleY }));
}
