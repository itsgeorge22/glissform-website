import { cancelHeroFrame, requestSceneFrame } from '../hero-test-animation/frameSync.ts';

export const macScrollTiming = { maxSpeed: 1600, maxPendingMs: 80, maxFrameMs: 64 } as const;

/** Keep small deltas exact; discard excess pressure instead of banking a long flick. */
export function createMacScrollLimiter(scale: () => number = () => 1) {
  let pending = 0;
  return {
    add(delta: number) {
      if (!Number.isFinite(delta) || !delta) return;
      if (Math.sign(delta) !== Math.sign(pending)) pending = 0;
      const limit = macScrollTiming.maxSpeed * scale() * macScrollTiming.maxPendingMs / 1000;
      pending = Math.sign(delta) * Math.min(limit, Math.abs(pending) + Math.abs(delta));
    },
    step(elapsed: number) {
      const allowance = macScrollTiming.maxSpeed * scale() * Math.max(0, Math.min(macScrollTiming.maxFrameMs, elapsed)) / 1000;
      const delta = Math.sign(pending) * Math.min(Math.abs(pending), allowance);
      pending -= delta;
      return delta;
    },
    get pending() { return pending; },
    reset() { pending = 0; },
  };
}

/** Own wheel movement only inside the Mac scene; the page and its artwork share one position. */
export function controlMacScroll(bounds: () => { start: number; end: number; enabled: boolean }, onMove: () => void, scale: () => number = () => 1) {
  const limiter = createMacScrollLimiter(scale);
  let frame = 0, previousTime = 0, position = window.scrollY, writtenY = position;
  const reset = () => {
    cancelHeroFrame(frame); frame = 0;
    previousTime = 0; limiter.reset();
    position = writtenY = window.scrollY;
  };
  const tick = (time: number) => {
    frame = 0;
    const { start, end, enabled } = bounds();
    if (!enabled || document.hidden || document.querySelector('dialog:modal')) { reset(); return; }
    const elapsed = Math.max(0, Math.min(macScrollTiming.maxFrameMs, time - previousTime));
    const delta = limiter.step(elapsed);
    previousTime = Math.max(previousTime, time);
    position = Math.max(start, Math.min(end, position + delta));
    window.scrollTo({ top: position, behavior: 'instant' });
    writtenY = window.scrollY;
    onMove();
    if ((position === start && limiter.pending < 0) || (position === end && limiter.pending > 0)) limiter.reset();
    if (limiter.pending) frame = requestSceneFrame(tick);
    else previousTime = 0;
  };
  const wheel = (event: WheelEvent) => {
    if (document.querySelector('dialog:modal')) { reset(); return; }
    // Preserve other controls, pinch zoom and horizontal gestures.
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey || !event.deltaY
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
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
  // Direct navigation and lifecycle changes never inherit queued movement.
  const scroll = () => { if (window.scrollY !== writtenY) reset(); };
  const visibility = () => { if (document.hidden) reset(); };
  window.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('keydown', reset);
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
      window.removeEventListener('keydown', reset);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('resize', reset);
      window.removeEventListener('pagehide', reset);
      window.removeEventListener('pageshow', reset);
      document.removeEventListener('visibilitychange', visibility);
    },
  };
}
