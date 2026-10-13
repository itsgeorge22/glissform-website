import { cancelHeroFrame, requestSceneFrame } from '../hero-test-animation/frameSync.ts';

export const macScrollTiming = { maxSpeed: 1600, maxPendingMs: 80, maxFrameMs: 64 } as const;

/** Keep small deltas exact; discard excess pressure instead of banking a long flick. */
export function createMacScrollLimiter() {
  let pending = 0;
  return {
    add(delta: number) {
      if (!Number.isFinite(delta) || !delta) return;
      if (Math.sign(delta) !== Math.sign(pending)) pending = 0;
      const limit = macScrollTiming.maxSpeed * macScrollTiming.maxPendingMs / 1000;
      pending = Math.sign(delta) * Math.min(limit, Math.abs(pending) + Math.abs(delta));
    },
    step(elapsed: number) {
      const allowance = macScrollTiming.maxSpeed * Math.max(0, Math.min(macScrollTiming.maxFrameMs, elapsed)) / 1000;
      const delta = Math.sign(pending) * Math.min(Math.abs(pending), allowance);
      pending -= delta;
      return delta;
    },
    get pending() { return pending; },
    reset() { pending = 0; },
  };
}

/** Match the incoming velocity, then arrive at rest without overshooting or exceeding the cap. */
export function createMacScrollHandoff(from: number, to: number, velocity = 0) {
  const distance = Math.abs(to - from), direction = Math.sign(to - from);
  const speed = Math.max(0, Math.min(macScrollTiming.maxSpeed, velocity * direction));
  const baseDuration = Math.max(1200, distance * 1.5 / macScrollTiming.maxSpeed * 1000);
  // Keep the initial Hermite tangent at most twice the distance. A fast input
  // near the endpoint therefore settles sooner instead of overshooting it.
  const duration = distance ? Math.min(baseDuration, speed ? 2000 * distance / speed : baseDuration) : 0;
  const tangent = speed * duration / 1000;
  return {
    from, to, duration,
    position(elapsed: number) {
      const t = duration ? Math.max(0, Math.min(1, elapsed / duration)) : 1;
      return from + direction * (distance * t * t * (3 - 2 * t) + tangent * t * (1 - t) ** 2);
    },
  };
}

/** Own wheel movement only inside the Mac scene; the page and its artwork share one position. */
export function controlMacScroll(bounds: () => { start: number; end: number; enabled: boolean; returnDistance?: number; forwardStart?: number }, onMove: () => void) {
  const limiter = createMacScrollLimiter();
  let frame = 0, previousTime = 0, position = window.scrollY, writtenY = position;
  let handoff: (ReturnType<typeof createMacScrollHandoff> & { elapsed: number }) | undefined;
  let returnTarget: number | undefined, lastMovementTime: number | undefined;
  const reset = () => {
    handoff = undefined; returnTarget = undefined; lastMovementTime = undefined;
    cancelHeroFrame(frame); frame = 0;
    previousTime = 0; limiter.reset();
    position = writtenY = window.scrollY;
  };
  const movementVelocity = (delta: number, time: number) => {
    // Measure accepted page movement between frames, not raw wheel pressure or
    // the short event-to-frame delay. Never carry a stale pre-pause velocity.
    const gap = lastMovementTime === undefined ? 0 : time - lastMovementTime;
    const interval = gap > 0 && gap <= macScrollTiming.maxPendingMs ? gap : 1000 / 60;
    lastMovementTime = time;
    return Math.max(-macScrollTiming.maxSpeed, Math.min(macScrollTiming.maxSpeed, delta * 1000 / interval));
  };
  const beginHandoff = (to: number, velocity = 0) => {
    limiter.reset();
    handoff = { ...createMacScrollHandoff(position, to, velocity), elapsed: 0 };
  };
  const finishForward = (velocity: number) => {
    const { enabled, end, forwardStart } = bounds();
    if (!enabled || forwardStart === undefined || position < forwardStart || position >= end) return false;
    beginHandoff(end, velocity);
    return true;
  };
  const tick = (time: number) => {
    frame = 0;
    const { start, end, enabled } = bounds();
    if (!enabled || document.hidden) { reset(); return; }
    const elapsed = Math.max(0, Math.min(macScrollTiming.maxFrameMs, time - previousTime));
    let delta = limiter.step(elapsed);
    if (handoff) {
      handoff.elapsed = Math.min(handoff.duration, handoff.elapsed + elapsed);
      delta = handoff.position(handoff.elapsed) - position;
      if (handoff.elapsed === handoff.duration) handoff = undefined;
    }
    previousTime = Math.max(previousTime, time);
    position = Math.max(start, Math.min(end, position + delta));
    window.scrollTo({ top: position, behavior: 'instant' });
    writtenY = window.scrollY;
    onMove();
    const velocity = movementVelocity(delta, time);
    if (returnTarget !== undefined && delta < 0) {
      beginHandoff(returnTarget, velocity); returnTarget = undefined;
    } else if (!handoff && delta > 0) finishForward(velocity);
    if ((position === start && limiter.pending < 0) || (position === end && limiter.pending > 0)) limiter.reset();
    if (handoff || limiter.pending) frame = requestSceneFrame(tick);
    else previousTime = 0;
  };
  const startReturn = (inputDelta?: number) => {
    const { start, end, enabled, returnDistance = 0 } = bounds();
    if (!enabled || returnDistance <= 0 || window.scrollY < end - 1 || window.scrollY > end + 1) return false;
    reset();
    const to = Math.max(start, end - returnDistance);
    // Accept the triggering wheel movement first so the reverse handoff also
    // inherits its real, capped speed. Keyboard return begins from rest.
    if (inputDelta !== undefined) { returnTarget = to; limiter.add(inputDelta); }
    else beginHandoff(to);
    previousTime = performance.now();
    frame = requestSceneFrame(tick);
    return true;
  };
  const wheel = (event: WheelEvent) => {
    // Feature navigation owns cancelled events; pinch zoom and horizontal gestures remain native.
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey || !event.deltaY
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    if (handoff) {
      if (Math.sign(event.deltaY) === Math.sign(handoff.to - handoff.from)) { event.preventDefault(); return; }
      reset(); // Opposite input takes over on this very event, without a queued tail.
    }
    if (returnTarget !== undefined && event.deltaY > 0) reset();
    if (event.deltaY < 0 && returnTarget === undefined && startReturn(event.deltaY * unit)) { event.preventDefault(); return; }
    const { start, end, enabled } = bounds();
    const y = window.scrollY;
    if (!enabled || y < start || y > end || (y <= start && event.deltaY < 0) || (y >= end && event.deltaY > 0)) {
      reset(); return;
    }
    event.preventDefault();
    if (y !== writtenY) reset();
    limiter.add(event.deltaY * unit);
    if (!frame) { previousTime = performance.now(); frame = requestSceneFrame(tick); }
  };
  const key = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey
      || (event.target instanceof HTMLElement && event.target.closest('a, button, input, textarea, select, [contenteditable="true"]'))) return;
    const up = event.key === 'ArrowUp' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey);
    const down = event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey);
    if (handoff) {
      if ((up && handoff.to < handoff.from) || (down && handoff.to > handoff.from)) {
        event.preventDefault(); return;
      }
      reset();
    }
    if (up && startReturn()) { event.preventDefault(); return; }
    reset();
  };
  // Direct navigation, resizing and lifecycle changes never inherit queued movement.
  const scroll = () => {
    if (window.scrollY === writtenY) return;
    const forward = window.scrollY > writtenY;
    const time = performance.now();
    const velocity = movementVelocity(window.scrollY - writtenY, time);
    reset();
    lastMovementTime = time;
    if (forward && finishForward(velocity)) {
      previousTime = performance.now();
      frame = requestSceneFrame(tick);
    }
  };
  const visibility = () => { if (document.hidden) reset(); };
  window.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('keydown', key);
  window.addEventListener('pointerdown', reset);
  window.addEventListener('resize', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', reset);
  document.addEventListener('visibilitychange', visibility);
  return {
    reset,
    dispose() {
      reset();
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('keydown', key);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('resize', reset);
      window.removeEventListener('pagehide', reset);
      window.removeEventListener('pageshow', reset);
      document.removeEventListener('visibilitychange', visibility);
    },
  };
}
