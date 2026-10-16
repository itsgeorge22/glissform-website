import { ease } from './choreography.ts';

const starArrivalTiming = { start: 230, stagger: 180, duration: 380, depthDuration: 140 } as const;
const rippleTiming = {
  start: 350,
  duration: 1400,
} as const;
export const heroPreludeTiming = { content: 600, duration: rippleTiming.start + rippleTiming.duration } as const;

const phase = (time: number, start: number, duration: number) => Math.max(0, Math.min(1, (time - start) / duration));

/** The full-bleed blue surface becomes the existing inset display. */
export function drawScreenFormation(time: number, targets: {
  surface: HTMLElement; screen: HTMLElement; frame: HTMLElement; notch: HTMLElement;
  glow: HTMLElement; field: HTMLElement; width: number; height: number; scale: number;
  stars: { element: HTMLElement; x: number; y: number }[];
}) {
  const { surface, screen, frame, notch, glow, field, width, height, stars, scale } = targets;
  const shape = ease(phase(time, 150, 500));
  const rounding = ease(phase(time, 210, 440));
  const light = ease(phase(time, 0, 760));
  const notchGrowth = ease(phase(time, 220, 460));
  const scaleX = 1 + 32 * scale / width * (1 - shape);
  const scaleY = 1 + 32 * scale / height * (1 - shape);
  const outset = -16 * scale * (1 - shape);

  surface.style.backgroundColor = 'var(--scene-bezel)';
  for (const element of [screen, frame]) {
    // These layers share the Mac scene's top-left transform origin.
    element.style.transform = `translate(${outset}px, ${outset}px) scale(${scaleX}, ${scaleY})`;
    element.style.borderRadius = `${17 * scale * rounding}px`;
  }
  const edgeLight = Math.sin(Math.PI * shape) * .13;
  frame.style.opacity = String(ease(phase(time, 190, 460)));
  frame.style.boxShadow = `0 0 ${24 * scale}px color-mix(in srgb, var(--scene-edge-light) ${edgeLight * 100}%, transparent), inset 0 0 ${12 * scale}px color-mix(in srgb, var(--scene-edge-light) ${edgeLight * 50}%, transparent)`;
  // Grow down from the top, keeping the attachment behind the moving bezel.
  // Both movements are monotonic: the notch cannot overshoot into a gap.
  notch.style.translate = `0 ${Math.min(-26 * scale * (1 - notchGrowth), outset)}px`;
  notch.style.scale = `1 ${notchGrowth}`;
  notch.style.opacity = String(ease(phase(time, 220, 180)));
  glow.style.opacity = String(light);
  glow.style.transform = `translate3d(0, ${76 * scale * (1 - light)}px, 0) scale(${.86 + .14 * light})`;
  field.style.opacity = '1';

  // Send the pulse at 350ms, overlapping the final star arrivals.
  const wave = phase(time, rippleTiming.start, rippleTiming.duration);
  const radius = (Math.hypot(width, height) / 2 + 130 * scale) * wave;
  const waveStrength = ease(wave / .12) * (1 - ease((wave - .78) / .22));
  for (const { element, x, y } of stars) {
    // Stable spatial variation gives the existing stars different apparent
    // depths without changing their resting layout, twinkle or interactions.
    const depth = (Math.sin(x / scale * 12.9898 + y / scale * 78.233) * 43758.5453) % 1;
    const layer = Math.abs(depth);
    const arrival = ease(phase(time, starArrivalTiming.start + layer * starArrivalTiming.stagger,
      starArrivalTiming.duration + layer * starArrivalTiming.depthDuration));
    const dx = x - width / 2, dy = y - height / 2;
    const distance = Math.hypot(dx, dy);
    const crest = Math.exp(-2 * ((distance - radius) / (130 * scale)) ** 2) * waveStrength;
    // Begin slightly inward, then let one broad pulse travel out through
    // the field. The pulse changes star motion and light, without an overlay.
    const drift = (-(1 - arrival) * (12 + layer * 8) * Math.min(1, distance / (240 * scale)) + crest * 16) * scale;
    element.style.opacity = String(arrival);
    element.style.translate = `${distance ? dx / distance * drift : 0}px ${distance ? dy / distance * drift : 0}px`;
    element.style.scale = String(1 + (1 - arrival) * (.3 + layer * .5) + crest * .3);
    element.style.filter = `blur(${(1 - arrival) * (1 + layer * 2) * scale}px) brightness(${1 + crest * 1.2})`;
  }
}
