export const navigationSections = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'seamless-close-features', label: 'Features' },
  { id: 'good-to-know', label: 'FAQ' },
] as const;

/** Later surfaces win when the FAQ covers the sticky feature section. */
export function visibleNavigationSection(ranges: { id: string; top: number; bottom: number }[], viewportHeight: number) {
  const readingLine = Math.min(320, viewportHeight * .35);
  return [...ranges].reverse().find(({ top, bottom }) => top <= readingLine && bottom > readingLine)?.id;
}

export function clearSectionHash() {
  if (navigationSections.some(({ id }) => location.hash === `#${id}`) || location.hash === '#privacy') {
    history.replaceState(history.state, '', location.pathname + location.search);
  }
}

/** One observer updates both the projected and fixed navigation bars. */
export function trackSectionNavigation() {
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-section-link]');
  const highlights = [...document.querySelectorAll<HTMLElement>('.hero-test__active-link')];
  const sections = navigationSections.map(({ id }) => ({
    id,
    // Track the arriving surface, not the FAQ copy inset 200px below its edge.
    element: id === 'good-to-know' ? document.querySelector('.faq-section') : document.getElementById(id),
  }));
  let frame = 0;
  let clickedSection: string | undefined;
  let settleTimer = 0;
  const draw = () => {
    frame = 0;
    const active = clickedSection ?? visibleNavigationSection(sections.flatMap(({ id, element }) => {
      if (!element) return [];
      const { top, bottom } = element.getBoundingClientRect();
      return [{ id, top, bottom }];
    }), window.innerHeight);
    for (const link of links) {
      if (link.dataset.sectionLink === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    for (const highlight of highlights) {
      const link = highlight.parentElement?.querySelector<HTMLAnchorElement>('[aria-current="location"]');
      if (link) {
        // Layout coordinates remain correct inside the projected Mac display.
        highlight.style.setProperty('--active-link-x', `${link.offsetLeft}px`);
        highlight.style.setProperty('--active-link-width', `${link.offsetWidth}px`);
        if (!highlight.dataset.positioned) {
          // Start at the first active link without sliding in from zero width.
          void highlight.offsetWidth;
          highlight.dataset.positioned = 'true';
        }
      }
      highlight.dataset.visible = String(Boolean(link));
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const releaseClick = () => {
    clearTimeout(settleTimer);
    clickedSection = undefined;
    schedule();
  };
  const scroll = () => {
    // A quiet-scroll fallback also handles browsers without scrollend and
    // clicks on a section that is already at its destination.
    if (clickedSection) {
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(releaseClick, 160);
    }
    schedule();
  };
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = (event.currentTarget as HTMLAnchorElement).dataset.sectionLink;
    const section = id && document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    clearSectionHash();
    clickedSection = id;
    cancelAnimationFrame(frame);
    draw();
    section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    scroll();
  };
  const keydown = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releaseClick();
  };
  // Let direct incoming fragment links reach their destination once, then keep
  // subsequent reloads governed by native position restoration.
  const loaded = () => { clearSectionHash(); schedule(); };
  const size = new ResizeObserver(schedule);
  size.observe(document.body);
  for (const highlight of highlights) size.observe(highlight.parentElement!);
  for (const link of links) link.addEventListener('click', click);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('scrollend', releaseClick);
  window.addEventListener('wheel', releaseClick, { passive: true });
  window.addEventListener('touchstart', releaseClick, { passive: true });
  window.addEventListener('pointerdown', releaseClick, { passive: true });
  window.addEventListener('keydown', keydown);
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('load', loaded);
  if (document.readyState === 'complete') loaded();
  draw();
  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(settleTimer);
    size.disconnect();
    for (const link of links) link.removeEventListener('click', click);
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('scrollend', releaseClick);
    window.removeEventListener('wheel', releaseClick);
    window.removeEventListener('touchstart', releaseClick);
    window.removeEventListener('pointerdown', releaseClick);
    window.removeEventListener('keydown', keydown);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    window.removeEventListener('load', loaded);
    for (const link of links) link.removeAttribute('aria-current');
    for (const highlight of highlights) {
      highlight.removeAttribute('style');
      delete highlight.dataset.positioned;
      delete highlight.dataset.visible;
    }
  };
}
