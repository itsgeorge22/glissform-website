import { ease } from './choreography.ts';
import { phase } from './featureDemoMotion.ts';
import { runSeamlessFeatureDemo } from './seamlessFeaturePlayback.ts';

// Native timelines retain their internal motion. Shared playback removes each
// lead-in and holds the finished pose until the whole section restarts.
export const seamlessMiniCycle = 10.2;
export type DesktopReturnDemo = 'pause' | 'escape' | 'connection';

export const desktopReturnTiming = {
  pause: { fold: .7, foldDuration: .7, restore: 2.8, restoreDuration: .54 },
  escape: { fold: 1.65, foldDuration: .7, restore: 3.35, restoreDuration: .54 },
  connection: { fold: 3.35, foldDuration: .7, restore: 4.7, restoreDuration: .54 },
} as const;

const blurTiming = { start: 1, clear: 6.6, clearDuration: .75 } as const;
const pauseIndicatorTiming = { fade: 5.5, fadeDuration: .3 } as const;
const connectionGlowTiming = { peak: .06, hold: .08, fade: .38 } as const;

export function blurDemoPose(seconds: number, reducedMotion = false) {
  if (reducedMotion) return { blur: 0, label: 0, phase: 'Off' };
  const t = seconds % seamlessMiniCycle;
  const subtle = ease(phase(t, blurTiming.start, .65));
  const regular = ease(phase(t, 2.65, .65));
  const high = ease(phase(t, 4.3, .65));
  const clear = ease(phase(t, blurTiming.clear, blurTiming.clearDuration));
  return {
    blur: 2.5 * subtle + 4.5 * regular + 5 * high - 12 * clear,
    label: ease(phase(t, 1.32, .26)) + ease(phase(t, 2.97, .26))
      + ease(phase(t, 4.62, .26)) + ease(phase(t, 6.98, .26)),
    phase: t < 1 ? 'Off' : t < 2.65 ? 'Subtle' : t < 4.3 ? 'Regular' : t < 6.6 ? 'High' : 'Off',
  };
}

export function desktopReturnDemoPose(mode: DesktopReturnDemo, seconds: number, reducedMotion = false) {
  const still = { fold: 0, wait: 0, timer: mode === 'pause' ? 1 : 0, confirmation: 0, pressure: 0, glow: 0, phase: 'idle' };
  if (reducedMotion) return { ...still, glow: mode === 'connection' ? .24 : 0 };

  const t = seconds % seamlessMiniCycle;
  const timing = desktopReturnTiming[mode];
  const stopped = timing.fold + timing.foldDuration;
  const settled = timing.restore + timing.restoreDuration;
  const fold = ease(phase(t, timing.fold, timing.foldDuration)) - ease(phase(t, timing.restore, timing.restoreDuration));
  const state = t < timing.fold ? 'idle' : t < stopped ? 'folding' : t < timing.restore ? 'waiting' : t < settled ? 'restoring' : 'settled';

  if (mode === 'pause') {
    return { ...still, fold,
      wait: phase(t, stopped, timing.restore - stopped),
      timer: ease(phase(t, stopped, .18)) * (1 - ease(phase(t, pauseIndicatorTiming.fade, pauseIndicatorTiming.fadeDuration))),
      confirmation: ease(phase(t, settled, .24)),
      phase: state,
    };
  }
  if (mode === 'escape') {
    return { ...still, fold,
      pressure: ease(phase(t, timing.restore - .1, .12)) * (1 - ease(phase(t, timing.restore + .28, .24))),
      phase: state,
    };
  }

  // Connection feedback belongs to contact: build only in the final five
  // degrees, then let one gentle pulse retreat after the surface is flat.
  const contact = t >= timing.restore ? ease(Math.max(0, 1 - fold * 42 / 5)) : 0;
  const pulse = .65 + .35 * ease(phase(t, settled, connectionGlowTiming.peak));
  const glow = contact * pulse * (1 - ease(phase(t, settled + connectionGlowTiming.hold, connectionGlowTiming.fade)));
  return { ...still, fold, glow, phase: glow > .05 ? 'contact' : state };
}

export function animateBlurVisual(root: HTMLElement) {
  const draw = (seconds: number, reducedMotion: boolean) => {
    const pose = blurDemoPose(seconds, reducedMotion);
    root.style.setProperty('--blur-amount', `${pose.blur}em`);
    root.style.setProperty('--blur-label', String(pose.label));
    root.dataset.phase = pose.phase;
  };
  return runSeamlessFeatureDemo(root, { measure: () => {}, draw, cleanup: () => {
    root.style.removeProperty('--blur-amount');
    root.style.removeProperty('--blur-label');
    root.removeAttribute('data-phase');
  } }, { start: blurTiming.start, finish: blurTiming.clear + blurTiming.clearDuration });
}

export function animateDesktopReturnVisual(root: HTMLElement, mode: DesktopReturnDemo) {
  const properties = ['--surface-fold', '--wait-progress', '--timer-opacity', '--return-confirmation', '--key-pressure', '--connection-glow'];
  const draw = (seconds: number, reducedMotion: boolean) => {
    const pose = desktopReturnDemoPose(mode, seconds, reducedMotion);
    [pose.fold, pose.wait, pose.timer, pose.confirmation, pose.pressure, pose.glow].forEach((value, index) => {
      root.style.setProperty(properties[index], String(value));
    });
    root.dataset.phase = pose.phase;
  };
  const timing = desktopReturnTiming[mode];
  const finish = mode === 'pause'
    ? pauseIndicatorTiming.fade + pauseIndicatorTiming.fadeDuration
    : timing.restore + timing.restoreDuration + (mode === 'connection' ? connectionGlowTiming.hold + connectionGlowTiming.fade : 0);
  return runSeamlessFeatureDemo(root, { measure: () => {}, draw, cleanup: () => {
    for (const property of properties) root.style.removeProperty(property);
    root.removeAttribute('data-phase');
  } }, { start: timing.fold, finish });
}
