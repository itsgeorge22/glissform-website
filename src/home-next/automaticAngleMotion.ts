import { ease } from './choreography.ts';
import { createAngleCounter } from './angleCounterMotion.ts';
import { phase } from './featureDemoMotion.ts';
import { runSeamlessFeatureDemo } from './seamlessFeaturePlayback.ts';

export const automaticAngleTiming = {
  open: 1.1,
  openDuration: 1.35,
  close: 5.05,
  closeDuration: 1.35,
  detectWait: 1,
  confirmationDuration: .24,
  cycle: 9.6,
} as const;

export const automaticAngleDrawing = {
  width: 360, height: 270,
  hinge: { x: 112, y: 184 },
  panelLength: 132, arcRadius: 58, labelRadius: 102,
} as const;

export function automaticAnglePose(seconds: number, reducedMotion = false) {
  if (reducedMotion) return { angle: 75, confirmation: 1 };
  const t = seconds % automaticAngleTiming.cycle;
  const { open, openDuration, close, closeDuration, detectWait, confirmationDuration } = automaticAngleTiming;
  const angle = 75 + 40 * ease(phase(t, open, openDuration))
    - 40 * ease(phase(t, close, closeDuration));
  // A completed reading stays confirmed until movement starts. Each new
  // position must remain still for the detection wait before confirming again.
  const confirmation = t < open ? 1
    : t < open + .16 ? 1 - ease(phase(t, open, .16))
    : t < close ? ease(phase(t, open + openDuration + detectWait, confirmationDuration))
    : t < close + .16 ? 1 - ease(phase(t, close, .16))
    : ease(phase(t, close + closeDuration + detectWait, confirmationDuration));
  return { angle, confirmation };
}

export function automaticAngleGeometry(angle: number) {
  const { hinge, arcRadius: radius, labelRadius } = automaticAngleDrawing;
  const radians = angle * Math.PI / 180;
  return {
    lidTransform: `translate(${hinge.x} ${hinge.y}) rotate(${-angle})`,
    arc: `M ${hinge.x + radius} ${hinge.y} A ${radius} ${radius} 0 0 0 ${hinge.x + radius * Math.cos(radians)} ${hinge.y - radius * Math.sin(radians)}`,
    label: { x: hinge.x + labelRadius * Math.cos(radians / 2), y: hinge.y - labelRadius * Math.sin(radians / 2) },
  };
}

export function animateAutomaticAngle(root: HTMLElement) {
  const lid = root.querySelector<SVGGElement>('.automatic-angle-visual__lid')!;
  const arc = root.querySelector<SVGPathElement>('.automatic-angle-visual__arc')!;
  const reading = root.querySelector<HTMLElement>('.automatic-angle-visual__reading')!;
  const drawCounter = createAngleCounter(root.querySelector<HTMLElement>('.angle-counter')!);

  const draw = (seconds: number, reducedMotion: boolean) => {
    const { angle, confirmation } = automaticAnglePose(seconds, reducedMotion);
    const geometry = automaticAngleGeometry(angle);
    lid.setAttribute('transform', geometry.lidTransform);
    arc.setAttribute('d', geometry.arc);
    reading.style.left = `${geometry.label.x / automaticAngleDrawing.width * 100}%`;
    reading.style.top = `${geometry.label.y / automaticAngleDrawing.height * 100}%`;
    root.style.setProperty('--angle-confirmation', String(confirmation));
    root.dataset.angle = String(Math.round(angle));
    root.dataset.detected = String(confirmation >= .999);
    drawCounter(angle);
  };

  const { open, close, closeDuration, detectWait, confirmationDuration } = automaticAngleTiming;
  return runSeamlessFeatureDemo(root, { measure: () => {}, draw, cleanup: () => {
    draw(0, true);
    root.style.removeProperty('--angle-confirmation');
    root.removeAttribute('data-angle'); root.removeAttribute('data-detected');
  } }, { start: open, finish: close + closeDuration + detectWait + confirmationDuration });
}
