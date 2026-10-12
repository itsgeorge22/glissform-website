import { ease } from './choreography.ts';
import { cancelHeroFrame, requestSceneFrame } from '../hero-test-animation/frameSync.ts';

// Time from a completed cursor exit to the next entrance, including its lead-in.
export const featureDemoPause = 2;
// Start each fresh demo at its cursor entrance, skipping the old initial wait.
// Keep the loop timelines intact so all repeat pauses and motion stay unchanged.
export const featureDemoEntrance = .35;
export const featureCursorTravel = 1.05;

export type Point = { x: number; y: number };
export type Curve = [Point, Point, Point, Point];
// Mirror the exit's two control handles into a bottom-left approach. Put the
// silhouette at the clip edge so the shared easing has no hidden lead-in.
export const featureCursorArrival = (width: number, height: number, unit: number, cursorUnit: number, target: Point): Curve => [
  { x: -23.55 * cursorUnit, y: height - 38 * cursorUnit - 24 },
  { x: width * .09, y: height - 20 * unit },
  { x: target.x - 90 * unit, y: target.y + 16 * unit },
  target,
];
export const phase = (time: number, start: number, duration: number) => Math.max(0, Math.min(1, (time - start) / duration));
export const pointOn = ([a, b, c, d]: Curve, progress: number): Point => {
  const t = ease(progress), s = 1 - t;
  return {
    x: s ** 3 * a.x + 3 * s ** 2 * t * b.x + 3 * s * t ** 2 * c.x + t ** 3 * d.x,
    y: s ** 3 * a.y + 3 * s ** 2 * t * b.y + 3 * s * t ** 2 * c.y + t ** 3 * d.y,
  };
};
export const clickPressure = (time: number, press: number, release: number) => time < release
  ? ease(phase(time, press, release - press)) : 1 - ease(phase(time, release, .16));

/** Layout coordinates ignore hover and outer panel transforms. */
export function relativeOffset(element: HTMLElement, root: HTMLElement): Point {
  let x = 0, y = 0, node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft; y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Feature demonstrations share the same settled-panel clock and cleanup. */
export function runFeatureDemo(root: HTMLElement, demo: {
  measure: () => void;
  draw: (seconds: number, reducedMotion: boolean) => void;
  cleanup: () => void;
  resizeTargets?: Element[];
}) {
  const panel = root.closest<HTMLElement>('.settings-features__panel')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1056px)');
  let frame = 0, elapsed = featureDemoEntrance, lastTime = 0, visible = false, running = false, disposed = false;
  const draw = () => demo.draw(reduced.matches ? 0 : elapsed, reduced.matches);
  const measure = () => { demo.measure(); draw(); };
  const tick = (now: number) => {
    frame = 0;
    if (!running || disposed) return;
    if (lastTime) elapsed += (now - lastTime) / 1000;
    lastTime = now;
    draw();
    frame = requestSceneFrame(tick);
  };
  const sync = () => {
    if (disposed) return;
    const active = panel.dataset.featureActive === 'true';
    const departing = panel.dataset.featureDeparting === 'true';
    // A departing panel can cross the visibility threshold before the next
    // feature settles. Preserve its clock until the controller ends the handoff.
    const next = (active && visible || departing) && desktop.matches && !reduced.matches && !document.hidden;
    if ((!active && !departing) || reduced.matches || !desktop.matches) elapsed = featureDemoEntrance;
    root.dataset.playing = String(next);
    if (next === running) { if (!next) draw(); return; }
    running = next;
    lastTime = 0;
    cancelHeroFrame(frame); frame = 0;
    if (running) { measure(); frame = requestSceneFrame(tick); }
    else draw();
  };
  const visibility = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .5;
    sync();
  }, { threshold: [.5] });
  const activeState = new MutationObserver(sync);
  const size = new ResizeObserver(measure);
  visibility.observe(panel);
  activeState.observe(panel, { attributes: true, attributeFilter: ['data-feature-active', 'data-feature-departing'] });
  size.observe(root);
  for (const target of demo.resizeTargets ?? []) size.observe(target);
  reduced.addEventListener('change', sync);
  desktop.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  measure(); sync();
  return () => {
    disposed = true;
    cancelHeroFrame(frame);
    visibility.disconnect(); activeState.disconnect(); size.disconnect();
    reduced.removeEventListener('change', sync);
    desktop.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    root.removeAttribute('data-playing');
    demo.cleanup();
  };
}
