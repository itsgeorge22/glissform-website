import { desktopSceneQuery } from './responsive';

/** Keep the native sticky hold and its dimming layer aligned with the FAQ edge. */
export function trackCustomizationCover(section: HTMLElement) {
  const ending = section.closest<HTMLElement>('.home-ending');
  const faq = ending?.querySelector<HTMLElement>('.faq-section');
  if (!ending || !faq) return;

  const motion = window.matchMedia(desktopSceneQuery);
  let frame = 0, lastHeight = 0, lastProgress = '';
  const draw = () => {
    frame = 0;
    const progress = motion.matches
      ? Math.max(0, Math.min(1, 1 - faq.getBoundingClientRect().top / window.innerHeight))
      : 0;
    const value = progress.toFixed(4);
    if (value === lastProgress) return;
    lastProgress = value;
    ending.style.setProperty('--cover-progress', value);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const measure = () => {
    const height = section.getBoundingClientRect().height;
    if (height && height !== lastHeight) {
      lastHeight = height;
      ending.style.setProperty('--customization-height', `${height}px`);
    }
    if (motion.matches) ending.dataset.scrollCover = 'ready';
    else delete ending.dataset.scrollCover;
    schedule();
  };
  const size = new ResizeObserver(measure);
  size.observe(section);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  motion.addEventListener('change', measure);
  measure();

  return () => {
    cancelAnimationFrame(frame);
    size.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    motion.removeEventListener('change', measure);
    ending.style.removeProperty('--customization-height');
    ending.style.removeProperty('--cover-progress');
    delete ending.dataset.scrollCover;
  };
}
