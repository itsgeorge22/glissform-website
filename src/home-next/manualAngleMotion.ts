import { elementDesignScale } from './designScale.ts';
import { ease } from './choreography.ts';
import { createAngleCounter } from './angleCounterMotion.ts';
import { featureCursorArrival, featureCursorTravel, featureDemoEntrance, phase, pointOn, relativeOffset, type Curve } from './featureDemoMotion.ts';
import { runSeamlessFeatureDemo } from './seamlessFeaturePlayback.ts';

export const manualAngleTiming = {
  enter: featureDemoEntrance,
  approach: featureCursorTravel,
  press: 1.6,
  drag: 1.8,
  to110Duration: .85,
  to60: 2.9,
  to60Duration: 1.3,
  to90: 4.45,
  to90Duration: 1,
  release: 5.7,
  depart: 6.02,
  cycle: 9.12,
} as const;

export function manualAnglePose(seconds: number, reducedMotion = false) {
  const t = seconds % manualAngleTiming.cycle;
  const angle = reducedMotion ? 90 : 90
    + 20 * ease(phase(t, manualAngleTiming.drag, manualAngleTiming.to110Duration))
    - 50 * ease(phase(t, manualAngleTiming.to60, manualAngleTiming.to60Duration))
    + 30 * ease(phase(t, manualAngleTiming.to90, manualAngleTiming.to90Duration));
  const holding = !reducedMotion && t >= manualAngleTiming.press && t < manualAngleTiming.release;
  return {
    time: t,
    angle,
    position: (angle - 20) / 110,
    holding,
    pressure: reducedMotion ? 0 : ease(phase(t, manualAngleTiming.press, .12))
      * (1 - ease(phase(t, manualAngleTiming.release, .16))),
    tooltip: holding ? ease(phase(t, manualAngleTiming.press, .12))
      * (1 - ease(phase(t, manualAngleTiming.release - .12, .12))) : 0,
    cursorVisible: !reducedMotion && t >= manualAngleTiming.enter && t < manualAngleTiming.depart + featureCursorTravel,
  };
}

export function animateManualAngle(root: HTMLElement) {
  const control = root.querySelector<HTMLElement>('.manual-angle-visual__control')!;
  const tooltip = root.querySelector<HTMLElement>('.manual-angle-visual__tooltip')!;
  const cursor = root.querySelector<HTMLElement>('.manual-angle-visual__cursor')!;
  const drawCounter = createAngleCounter(root.querySelector<HTMLElement>('.angle-counter')!);
  let arrival: Curve, departure: Curve, startX = 0, trackWidth = 0, trackY = 0;

  const measure = () => {
    const offset = relativeOffset(control, root);
    startX = offset.x;
    trackWidth = control.offsetWidth;
    trackY = offset.y + control.offsetHeight / 2;
    const unit = parseFloat(getComputedStyle(control).fontSize) || 1;
    const from = { x: startX + trackWidth * (90 - 20) / 110, y: trackY };
    const to = from;
    arrival = featureCursorArrival(root.clientWidth, root.clientHeight, unit, unit, from, elementDesignScale(root));
    departure = [to,
      { x: to.x + 60 * unit, y: to.y - 12 * unit },
      { x: root.clientWidth * .95, y: 30 * unit },
      { x: root.clientWidth + 36 * unit, y: -36 * unit },
    ];
  };

  const draw = (seconds: number, reducedMotion: boolean) => {
    if (!arrival) return;
    const pose = manualAnglePose(seconds, reducedMotion);
    root.style.setProperty('--angle-position', `${pose.position * 100}%`);
    root.style.setProperty('--angle-pressure', String(pose.pressure));
    root.dataset.angle = String(Math.round(pose.angle));
    root.dataset.holding = String(pose.holding);
    tooltip.style.opacity = String(pose.tooltip);
    tooltip.style.transform = `translate(-50%, ${(1 - pose.tooltip) * 5}em) scale(${.96 + .04 * pose.tooltip})`;
    drawCounter(pose.angle);
    const point = pose.time < manualAngleTiming.drag
      ? pointOn(arrival, phase(pose.time, manualAngleTiming.enter, manualAngleTiming.approach))
      : pose.time < manualAngleTiming.depart
        ? { x: startX + trackWidth * pose.position, y: trackY }
        : pointOn(departure, phase(pose.time, manualAngleTiming.depart, featureCursorTravel));
    cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${1 - pose.pressure * .14})`;
    cursor.style.opacity = pose.cursorVisible ? '1' : '0';
  };

  return runSeamlessFeatureDemo(root, { measure, draw, cleanup: () => {
    root.style.removeProperty('--angle-position');
    root.style.removeProperty('--angle-pressure');
    root.removeAttribute('data-angle');
    root.removeAttribute('data-holding');
    tooltip.style.removeProperty('opacity'); tooltip.style.removeProperty('transform');
    cursor.style.removeProperty('opacity'); cursor.style.removeProperty('transform');
    drawCounter(90);
  } }, { start: manualAngleTiming.enter, finish: manualAngleTiming.depart + featureCursorTravel });
}
