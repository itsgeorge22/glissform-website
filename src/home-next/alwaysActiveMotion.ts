import { ease } from './choreography.ts';
import { springDisplacement } from './objectMotion.ts';
import { clickPressure, featureCursorArrival, featureCursorTravel, featureDemoEntrance, featureDemoPause, phase, pointOn, relativeOffset, runFeatureDemo, type Curve, type Point } from './featureDemoMotion.ts';

const timing = { enter: featureDemoEntrance, approach: featureCursorTravel, press: 1.76, release: 1.88, depart: 2.52, exit: featureCursorTravel, activatedHold: 1 };

const exitEnd = timing.depart + timing.exit;
const resetAt = exitEnd + timing.activatedHold;
const cycle = exitEnd + featureDemoPause - timing.enter;

/** A timed demonstration within a settled panel. It never handles real input. */
export function animateAlwaysActive(root: HTMLElement) {
  const card = root.querySelector<HTMLElement>('.always-active-visual__row--background')!;
  const cursor = root.querySelector<HTMLElement>('.always-active-visual__cursor')!;
  let arrival: Curve, departure: Curve, hoverAt = 0, leaveAt = 0;

  const draw = (time: number, reducedMotion: boolean) => {
    if (!arrival) return;
    const t = time % cycle;
    const point = t < timing.depart
      ? pointOn(arrival, phase(t, timing.enter, timing.approach))
      : pointOn(departure, phase(t, timing.depart, timing.exit));
    const press = clickPressure(t, timing.press, timing.release);
    const lift = t < timing.press ? ease(phase(t, hoverAt, .24))
      : t < timing.release ? 1 - press
      : t < leaveAt ? 1 - springDisplacement(phase(t, timing.release, .4), 8, 10)
      : 1 - ease(phase(t, leaveAt, .2));
    const reset = 1 - ease(phase(t, resetAt, .24));
    const enabled = ease(phase(t, timing.release, .18)) * reset;
    const thumb = (1 - springDisplacement(phase(t, timing.release, .32), 9, 10)) * reset;
    const stretch = Math.sin(Math.PI * phase(t, timing.release, .22)) ** 2 * .09;
    root.style.setProperty('--card-lift', String(reducedMotion ? 0 : lift));
    root.style.setProperty('--switch-on', String(reducedMotion ? 1 : enabled));
    root.style.setProperty('--switch-thumb', String(reducedMotion ? 1 : thumb));
    root.style.setProperty('--switch-stretch', String(reducedMotion ? 0 : stretch));
    cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${1 - press * .14})`;
    cursor.style.opacity = t >= timing.enter && t < timing.depart + timing.exit ? '1' : '0';
  };

  const measure = () => {
    // Offset geometry ignores the shell's handoff transforms and hover scale.
    const { x, y } = relativeOffset(card, root);
    const unit = parseFloat(getComputedStyle(root).fontSize) || 1;
    const width = root.clientWidth, height = root.clientHeight;
    const target = { x: x + card.offsetWidth * .68, y: y + card.offsetHeight * .58 };
    arrival = featureCursorArrival(width, height, unit, parseFloat(getComputedStyle(cursor).fontSize) || unit, target);
    departure = [target,
      { x: target.x + 90 * unit, y: target.y - 16 * unit },
      { x: width * .91, y: 20 * unit },
      { x: width + 36 * unit, y: -36 * unit },
    ];
    // Match hover to the cursor hotspot crossing the actual card, including resize.
    const inside = (point: Point) => point.x >= x && point.x <= x + card.offsetWidth
      && point.y >= y && point.y <= y + card.offsetHeight;
    const crossing = (curve: Curve, entering: boolean) => {
      let low = 0, high = 1;
      for (let i = 0; i < 18; i++) {
        const middle = (low + high) / 2;
        if (inside(pointOn(curve, middle)) === entering) high = middle;
        else low = middle;
      }
      return (low + high) / 2;
    };
    hoverAt = timing.enter + timing.approach * crossing(arrival, true);
    leaveAt = timing.depart + timing.exit * crossing(departure, false);
  };

  return runFeatureDemo(root, { measure, draw, cleanup: () => {
    root.style.removeProperty('--card-lift'); root.style.removeProperty('--switch-on');
    root.style.removeProperty('--switch-thumb'); root.style.removeProperty('--switch-stretch');
    cursor.style.removeProperty('transform'); cursor.style.removeProperty('opacity');
  } });
}
