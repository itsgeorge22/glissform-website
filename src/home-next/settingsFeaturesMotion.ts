import { createTextReveal } from './textRevealMotion.ts';
import { settingsFeaturesPose, nextSettingsFeature, settingsFeaturesTiming } from './settingsFeaturesChoreography.ts';
import { createSettingsWheelGesture } from './settingsFeaturesInput.ts';
import { cancelHeroFrame, requestSceneFrame } from '../hero-test-animation/frameSync.ts';

/** One gesture starts a handoff; opposite input retraces it without a jump. */
export function animateSettingsFeatures(section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>('.settings-features__stage')!;
  const items = Array.from(stage.querySelectorAll<HTMLElement>('.settings-features__item')).map(element => {
    const copy = element.querySelector<HTMLElement>('.settings-features__copy')!;
    return {
      copy,
      panel: element.querySelector<HTMLElement>('.settings-features__panel')!,
      // Headline and subtitle are one ordered set of lines, with one clock and direction.
      reveal: createTextReveal(copy, { travelPx: settingsFeaturesTiming.copyTravelPx, directionalStagger: true }),
    };
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1056px)');
  let frame = 0, height = 1, animated = false, disposed = false, current = 0;
  const gesture = createSettingsWheelGesture();
  let pendingDirection = 0;
  let transition: { from: number; to: number; elapsed: number; updatedAt: number; playback: 1 | -1 } | undefined;
  const styles = new WeakMap<HTMLElement, Map<string, string>>();
  const setStyle = (element: HTMLElement, property: string, value: string) => {
    let previous = styles.get(element);
    if (!previous) { previous = new Map(); styles.set(element, previous); }
    if (previous.get(property) === value) return;
    previous.set(property, value);
    element.style.setProperty(property, value);
  };
  const reset = () => {
    section.removeAttribute('data-motion');
    for (const { copy, panel } of items) {
      copy.style.removeProperty('visibility');
      panel.style.removeProperty('transform');
      for (const line of copy.querySelectorAll<HTMLElement>('.text-reveal__content')) {
        line.style.removeProperty('opacity');
        line.style.removeProperty('transform');
      }
      styles.delete(copy); styles.delete(panel);
    }
  };
  const draw = (elapsed = 0) => {
    const pose = settingsFeaturesPose(elapsed);
    const direction = transition ? Math.sign(transition.to - transition.from) : 1;
    const distance = height - 128 + 24; // Panel height plus the inter-panel gap.
    items.forEach((item, index) => {
      const outgoing = !!transition && index === transition.from;
      const incoming = !!transition && index === transition.to;
      const settled = !transition && index === current;
      const visibleCopy = settled || (outgoing && pose.exitCopy > 0)
        || (incoming && pose.enterCopy > 0);
      setStyle(item.copy, 'visibility', visibleCopy ? 'visible' : 'hidden');
      if (outgoing) {
        // Reverse the line reveal toward the current scroll direction's exit.
        // Both departing and arriving lines travel up on down-scroll, and vice versa.
        item.reveal(pose.exitCopy, -direction);
      } else if (incoming) {
        item.reveal(pose.enterCopy, direction);
      } else if (settled) {
        item.reveal(1);
      }
      // Keep the whole panel column connected, including neighboring previews.
      const position = transition ? transition.from + direction * pose.panel : current;
      const y = (index - position) * distance;
      setStyle(item.panel, 'transform', y === 0 ? 'none' : `translate3d(0, ${y}px, 0)`);
    });
  };
  const advance = (time: number) => {
    if (!transition) return;
    transition.elapsed = Math.max(0, Math.min(settingsFeaturesTiming.duration,
      transition.elapsed + (time - transition.updatedAt) * transition.playback));
    transition.updatedAt = time;
    if ((transition.playback === 1 && transition.elapsed === settingsFeaturesTiming.duration)
      || (transition.playback === -1 && transition.elapsed === 0)) {
      current = transition.playback === 1 ? transition.to : transition.from;
      transition = undefined;
    }
  };
  const tick = (time: number) => {
    frame = 0;
    if (!animated || disposed || (!transition && !pendingDirection) || document.hidden) return;
    advance(time);
    draw(transition?.elapsed);
    if (!transition && pendingDirection) {
      const direction = pendingDirection;
      pendingDirection = 0;
      if (pinned()) start(direction);
    }
    if (transition && !frame) frame = requestSceneFrame(tick);
  };
  const pinned = () => {
    const bounds = section.getBoundingClientRect();
    return animated && bounds.top <= 1 && bounds.bottom >= height - 1;
  };
  const pageScroll = () => {
    if (!pinned()) { gesture.reset(); pendingDirection = 0; }
  };
  const start = (direction: number) => {
    if (disposed) return;
    advance(performance.now());
    if (transition) {
      const playback = direction === Math.sign(transition.to - transition.from) ? 1 : -1;
      if (playback === transition.playback) {
        // Keep at most one deliberate next request; momentum never calls start.
        pendingDirection = direction;
        return;
      }
      pendingDirection = 0;
      // Keep the original pair/poses and turn time around at this exact point.
      transition.playback = playback;
      draw(transition.elapsed);
      return;
    }
    pendingDirection = 0;
    const next = nextSettingsFeature(current, direction, items.length);
    if (next === current) return;
    transition = { from: current, to: next, elapsed: 0, updatedAt: performance.now(), playback: 1 };
    draw();
    if (!frame) frame = requestSceneFrame(tick);
  };
  const wheel = (event: WheelEvent) => {
    if (!event.deltaY || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (!pinned()) {
      gesture.reset(); pendingDirection = 0;
      return;
    }
    const time = performance.now(), direction = Math.sign(event.deltaY);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
    const fresh = gesture.read(time, event.deltaY * unit);
    advance(time);
    // Direction changes retrace the active handoff immediately. Only a fresh
    // gesture can request the next adjacent feature or release a boundary.
    const boundary = nextSettingsFeature(current, direction, items.length) === current;
    if (!transition && fresh && boundary) return;
    event.preventDefault();
    if (fresh) start(direction);
  };
  const key = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !pinned()) return;
    if (event.target instanceof HTMLElement && event.target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
    const direction = ['ArrowDown', 'PageDown'].includes(event.key) ? 1
      : ['ArrowUp', 'PageUp'].includes(event.key) ? -1
      : event.key === ' ' ? (event.shiftKey ? -1 : 1) : 0;
    if (!direction) return;
    const boundary = nextSettingsFeature(current, direction, items.length) === current;
    if (!transition && !event.repeat && boundary) return;
    event.preventDefault();
    if (!event.repeat) start(direction);
  };
  const measure = () => {
    if (!animated || disposed) return;
    height = stage.clientHeight;
    advance(performance.now());
    draw(transition?.elapsed);
  };
  const settle = () => {
    pendingDirection = 0; gesture.reset();
    cancelHeroFrame(frame); frame = 0;
    if (transition) current = transition.playback === 1 ? transition.to : transition.from;
    transition = undefined;
    if (animated) draw();
  };
  const preference = () => {
    settle();
    animated = desktop.matches && !reducedMotion.matches;
    reset();
    if (animated) {
      section.dataset.motion = 'triggered';
      measure();
    }
  };
  const visibility = () => { if (document.hidden) settle(); else measure(); };
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  // Capture wheel input before it reaches any rendered child/layer.
  window.addEventListener('wheel', wheel, { passive: false, capture: true });
  window.addEventListener('scroll', pageScroll, { passive: true });
  window.addEventListener('keydown', key);
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  window.addEventListener('pagehide', settle);
  document.addEventListener('visibilitychange', visibility);
  reducedMotion.addEventListener('change', preference);
  desktop.addEventListener('change', preference);
  preference();

  return () => {
    disposed = true;
    cancelHeroFrame(frame);
    observer.disconnect();
    window.removeEventListener('wheel', wheel, true);
    window.removeEventListener('scroll', pageScroll);
    window.removeEventListener('keydown', key);
    window.removeEventListener('resize', measure);
    window.removeEventListener('pageshow', measure);
    window.removeEventListener('pagehide', settle);
    document.removeEventListener('visibilitychange', visibility);
    reducedMotion.removeEventListener('change', preference);
    desktop.removeEventListener('change', preference);
    reset();
  };
}
