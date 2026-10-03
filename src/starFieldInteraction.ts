type StarFieldOptions = {
  surface: HTMLElement;
  field?: HTMLElement;
  starSelector: string;
  radius?: number | ((width: number) => number);
  hoverScale?: (influence: number) => number;
  // Maximum cursor parallax per axis, in pixels, for each star. Opt-in for the hero.
  parallaxDepth?: (index: number) => number;
};

// Shared with the download card so attraction, brightness and release stay in sync.
export function connectStarField({ surface, field = surface, starSelector, radius = 190, hoverScale = influence => 1 + influence * .65, parallaxDepth }: StarFieldOptions) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const stars = Array.from(field.querySelectorAll<HTMLElement>(starSelector));
  const depths = stars.map((_, index) => parallaxDepth?.(index) ?? 0);
  let inView = false;
  let frame = 0;
  let clientX = 0;
  let clientY = 0;

  const resetPointer = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    stars.forEach(star => {
      star.style.removeProperty('transform');
      star.style.removeProperty('filter');
    });
  };
  const updatePlayback = () => {
    field.dataset.playing = String(inView && !document.hidden && !motion.matches);
    if (!inView || motion.matches || !pointer.matches || document.hidden) resetPointer();
  };
  const movePointer = (event: PointerEvent) => {
    if (!inView || document.hidden || motion.matches || !pointer.matches) return;
    clientX = event.clientX;
    clientY = event.clientY;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      const bounds = field.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      const reach = typeof radius === 'function' ? radius(bounds.width) : radius;
      const viewX = Math.max(-1, Math.min(1, x / Math.max(1, bounds.width) * 2 - 1));
      const viewY = Math.max(-1, Math.min(1, y / Math.max(1, bounds.height) * 2 - 1));
      // Read all home positions before writing transforms; offsets exclude drift.
      const positions = stars.map(star => ({ x: star.offsetLeft, y: star.offsetTop }));
      stars.forEach((star, index) => {
        const dx = x - positions[index].x;
        const dy = y - positions[index].y;
        const influence = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
        // Layer drift adds to attraction without changing hover scale or the click wrapper.
        star.style.transform = `translate(${dx * influence * .18 - viewX * depths[index]}px, ${dy * influence * .18 - viewY * depths[index]}px) scale(${hoverScale(influence)})`;
        star.style.filter = `brightness(${1 + influence * 1.8})`;
      });
      frame = 0;
    });
  };
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  observer.observe(surface);
  updatePlayback();
  surface.addEventListener('pointermove', movePointer);
  surface.addEventListener('pointerleave', resetPointer);
  surface.addEventListener('pointercancel', resetPointer);
  window.addEventListener('blur', resetPointer);
  window.addEventListener('resize', resetPointer);
  document.addEventListener('visibilitychange', updatePlayback);
  motion.addEventListener('change', updatePlayback);
  pointer.addEventListener('change', updatePlayback);

  return () => {
    observer.disconnect();
    resetPointer();
    delete field.dataset.playing;
    surface.removeEventListener('pointermove', movePointer);
    surface.removeEventListener('pointerleave', resetPointer);
    surface.removeEventListener('pointercancel', resetPointer);
    window.removeEventListener('blur', resetPointer);
    window.removeEventListener('resize', resetPointer);
    document.removeEventListener('visibilitychange', updatePlayback);
    motion.removeEventListener('change', updatePlayback);
    pointer.removeEventListener('change', updatePlayback);
  };
}
