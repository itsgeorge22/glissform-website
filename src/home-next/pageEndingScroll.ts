import { desktopSceneQuery } from './responsive';

/** Keep the native sticky hold and its dimming layer aligned with the FAQ edge. */
export function trackPageEnding(ending: HTMLElement) {
  const content = ending.querySelector<HTMLElement>('.page-ending__content');
  const faq = ending.querySelector<HTMLElement>('.faq-section');
  if (!content || !faq) return;

  const motion = window.matchMedia(desktopSceneQuery);
  let frame = 0, height = 0, lastHeight = 0, lastProgress = '', active = false;
  const draw = () => {
    frame = 0;
    if (!active || !height) return;
    // Read before writing either the sticky geometry or its dimming progress.
    const progress = Math.max(0, Math.min(1, 1 - faq.getBoundingClientRect().top / window.innerHeight));
    if (height !== lastHeight) {
      lastHeight = height;
      ending.style.setProperty('--preceding-content-height', `${height}px`);
    }
    if (ending.dataset.scrollCover !== 'ready') {
      ending.dataset.scrollCover = 'ready';
      // Enabling the cover extends the underlay. Read its new edge next frame.
      schedule();
    }
    const value = progress.toFixed(4);
    if (value === lastProgress) return;
    lastProgress = value;
    ending.style.setProperty('--cover-progress', value);
  };
  const schedule = () => { if (active && !frame) frame = requestAnimationFrame(draw); };
  const size = new ResizeObserver(entries => {
    if (!active) return;
    // Observer dimensions avoid the synchronous startup layout measurement.
    const entry = entries[0];
    height = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;
    schedule();
  });
  const stop = () => {
    active = false;
    cancelAnimationFrame(frame); frame = 0;
    size.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    ending.style.removeProperty('--preceding-content-height');
    ending.style.removeProperty('--cover-progress');
    delete ending.dataset.scrollCover;
    height = 0; lastHeight = 0; lastProgress = '';
  };
  const sync = () => {
    if (motion.matches === active) return;
    if (!motion.matches) { stop(); return; }
    active = true;
    size.observe(content, { box: 'border-box' });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
  };
  motion.addEventListener('change', sync);
  sync();

  return () => {
    stop();
    motion.removeEventListener('change', sync);
  };
}
