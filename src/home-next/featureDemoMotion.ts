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
export const featureCursorArrival = (width: number, height: number, unit: number, cursorUnit: number, target: Point, scale = 1): Curve => [
  { x: -23.55 * cursorUnit, y: height - 38 * cursorUnit - 24 * scale },
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

export type FeatureDemo = {
  measure: () => void;
  draw: (seconds: number, reducedMotion: boolean) => void;
  cleanup: () => void;
  resizeTargets?: Element[];
};

type GroupPlayback = {
  group: HTMLElement;
  start: number;
  finish: number;
  rest: number;
};

type DemoClock = {
  elapsed: number;
  lastTime: number;
  active: Set<symbol>;
  durations: Map<symbol, number>;
  cycle: number;
};

const groupClocks = new WeakMap<HTMLElement, DemoClock>();
const createDemoClock = (elapsed: number): DemoClock => ({
  elapsed, lastTime: 0, active: new Set(), durations: new Map(), cycle: 0,
});

/** Play visible demos, optionally sharing one clock across a whole group. */
export function runFeatureDemo(root: HTMLElement, demo: FeatureDemo, playback?: GroupPlayback) {
  const panel = root.closest<HTMLElement>('.settings-features__panel') ?? root;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialTime = playback ? 0 : featureDemoEntrance;
  const clock = (playback && groupClocks.get(playback.group)) || createDemoClock(initialTime);
  const member = Symbol();
  if (playback) groupClocks.set(playback.group, clock);
  clock.durations.set(member, playback ? playback.finish - playback.start : 0);
  const updateCycle = () => { clock.cycle = Math.max(0, ...clock.durations.values()) + (playback?.rest ?? 0); };
  updateCycle();

  let frame = 0, visible = false, running = false, disposed = false;
  const draw = () => {
    const seconds = playback
      ? playback.start + Math.min(clock.elapsed % clock.cycle, playback.finish - playback.start)
      : clock.elapsed;
    demo.draw(reduced.matches ? 0 : seconds, reduced.matches);
  };
  const measure = () => { demo.measure(); draw(); };
  const tick = (now: number) => {
    frame = 0;
    if (!running || disposed) return;
    // requestSceneFrame gives every member the same timestamp. Advance once,
    // regardless of how many members are visible or which one renders first.
    if (clock.lastTime !== now) {
      if (clock.lastTime) clock.elapsed += (now - clock.lastTime) / 1000;
      clock.lastTime = now;
    }
    draw();
    frame = requestSceneFrame(tick);
  };
  const sync = () => {
    if (disposed) return;
    const next = visible && !reduced.matches && !document.hidden;
    if (reduced.matches) { clock.elapsed = initialTime; clock.lastTime = 0; }
    root.dataset.playing = String(next);
    if (next === running) { if (!next) draw(); return; }
    running = next;
    cancelHeroFrame(frame); frame = 0;
    if (running) {
      if (!clock.active.size) clock.lastTime = 0;
      clock.active.add(member);
      measure(); frame = requestSceneFrame(tick);
    } else {
      clock.active.delete(member);
      if (!clock.active.size) clock.lastTime = 0;
      draw();
    }
  };
  const visibility = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .5;
    sync();
  }, { threshold: [.5] });
  const size = new ResizeObserver(measure);
  visibility.observe(panel);
  size.observe(root);
  for (const target of demo.resizeTargets ?? []) size.observe(target);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  measure(); sync();
  return () => {
    if (disposed) return;
    disposed = true;
    cancelHeroFrame(frame);
    clock.active.delete(member);
    clock.durations.delete(member);
    if (!clock.active.size) clock.lastTime = 0;
    updateCycle();
    if (playback && !clock.durations.size) groupClocks.delete(playback.group);
    visibility.disconnect(); size.disconnect();
    reduced.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    root.removeAttribute('data-playing');
    demo.cleanup();
  };
}
