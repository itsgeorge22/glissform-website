export type NavigationScrollState = { hidden: boolean; direction: number; distance: number };
export const navigationScrollThresholds = { hide: 80, show: 40 } as const;
const initialState = (): NavigationScrollState => ({ hidden: false, direction: 0, distance: 0 });

/** Measure one direction from its turning point, rather than every event. */
export function nextNavigationScrollState(state: NavigationScrollState, delta: number, beforeRelease = false): NavigationScrollState {
  if (beforeRelease) return initialState();
  if (!delta) return state;
  const direction = Math.sign(delta);
  const threshold = direction > 0 ? navigationScrollThresholds.hide : navigationScrollThresholds.show;
  const distance = Math.min(threshold, (direction === state.direction ? state.distance : 0) + Math.abs(delta));
  return { direction, distance, hidden: distance >= threshold ? direction > 0 : state.hidden };
}

/** Count only page movement beyond the MacBook's native sticky release. */
export function nextNavigationScrollPosition(state: NavigationScrollState, from: number, to: number, release: number) {
  const delta = Math.max(0, to - release) - Math.max(0, from - release);
  return nextNavigationScrollState(state, delta, to <= release);
}

/** Hide only the fixed top bar. The navbar inside the MacBook stays visible. */
export function trackNavigationScroll(container: HTMLElement, releasePosition: () => number) {
  const bar = container.querySelector<HTMLElement>('.hero-test__nav-motion')!;
  const position = () => Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
  let lastY = position(), disposed = false;
  let state = nextNavigationScrollPosition(initialState(), releasePosition(), lastY, releasePosition());
  let inputTimer = 0;
  const pendingInput: { event: Event; delta: number }[] = [];
  const draw = () => {
    const hidden = String(state.hidden);
    if (bar.dataset.scrollHidden !== hidden) bar.dataset.scrollHidden = hidden;
    if (bar.inert !== state.hidden) bar.inert = state.hidden;
    if (state.hidden) bar.setAttribute('aria-hidden', 'true');
    else bar.removeAttribute('aria-hidden');
  };
  const move = (next: NavigationScrollState) => {
    // Keyboard focus must never be carried offscreen with the bar.
    state = bar.contains(document.activeElement) ? initialState() : next;
    draw();
  };
  const scroll = () => {
    const y = position();
    move(nextNavigationScrollPosition(state, lastY, y, releasePosition()));
    lastY = y;
  };
  const afterInput = (event: Event, delta: number) => {
    pendingInput.push({ event, delta });
    if (inputTimer) return;
    inputTimer = window.setTimeout(() => {
      inputTimer = 0;
      const samples = pendingInput.splice(0);
      if (!disposed) for (const sample of samples) if (sample.event.defaultPrevented) {
        move(nextNavigationScrollState(state, sample.delta, position() < releasePosition() - 1));
      }
    }, 0);
  };
  const wheel = (event: WheelEvent) => {
    if (!event.deltaY || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    // Feature handoffs consume wheel input while the page stays pinned.
    // Read cancellation after all listeners; native scrolling is counted only
    // by the scroll handler, so the same movement can never count twice.
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    afterInput(event, event.deltaY * unit);
  };
  const key = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const page = window.innerHeight;
    const delta = event.key === 'ArrowDown' ? 40 : event.key === 'ArrowUp' ? -40
      : event.key === 'PageDown' ? page : event.key === 'PageUp' ? -page
      : event.key === ' ' ? (event.shiftKey ? -page : page) : 0;
    if (!delta) return;
    afterInput(event, delta);
  };
  const syncPosition = () => { lastY = position(); if (lastY <= releasePosition()) move(initialState()); };
  const focus = () => { state = initialState(); draw(); };
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('wheel', wheel, { passive: true });
  window.addEventListener('keydown', key);
  window.addEventListener('resize', syncPosition);
  window.addEventListener('pageshow', syncPosition);
  bar.addEventListener('focusin', focus);
  draw();

  return () => {
    disposed = true;
    window.clearTimeout(inputTimer);
    pendingInput.length = 0;
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('wheel', wheel);
    window.removeEventListener('keydown', key);
    window.removeEventListener('resize', syncPosition);
    window.removeEventListener('pageshow', syncPosition);
    bar.removeEventListener('focusin', focus);
    delete bar.dataset.scrollHidden;
    bar.inert = false;
    bar.removeAttribute('aria-hidden');
  };
}
