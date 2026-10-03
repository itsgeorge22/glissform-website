import type { QuietRegion } from './heroStarLayout';

export type ShootingStar = {
  x: number; y: number; dx: number; dy: number; angle: number;
  size: number; tail: number; duration: number;
};

export function createShootingStar(width: number, height: number, quietRegions: QuietRegion[], random = Math.random): ShootingStar | null {
  if (width < 600 || height < 300) return null;
  for (let attempt = 0; attempt < 64; attempt++) {
    const angle = 28 + random() * 24;
    const radians = angle * Math.PI / 180;
    let distance = 140 + random() * 100;
    const tail = 42 + random() * 14;
    const lane = Math.floor(random() * 3);
    if (quietRegions.length && lane !== 2) {
      const available = lane === 0
        ? Math.min(...quietRegions.map(rect => rect.left)) - 60
        : width - Math.max(...quietRegions.map(rect => rect.right)) - 60;
      // Fit the longer tail into narrow side lanes without approaching the copy.
      const maxDistance = (available - 8) / Math.cos(radians) - tail;
      if (maxDistance < 100) continue;
      distance = Math.min(distance, maxDistance);
    }
    const dx = Math.cos(radians) * distance;
    const dy = Math.sin(radians) * distance;
    const tailX = Math.cos(radians) * tail;
    const tailY = Math.sin(radians) * tail;
    let minX = 28 + tailX;
    let maxX = width - 28 - dx;
    if (quietRegions.length && lane === 0) maxX = Math.min(maxX, Math.min(...quietRegions.map(rect => rect.left)) - 32 - dx);
    if (quietRegions.length && lane === 1) minX = Math.max(minX, Math.max(...quietRegions.map(rect => rect.right)) + 32 + tailX);
    if (maxX < minX) continue;
    const minY = 80 + tailY;
    // Keep the entire flight and finishing glow above the screen's 70% line.
    const maxY = height * .7 - 32 - dy;
    if (maxY < minY) continue;
    const x = minX + random() * (maxX - minX);
    const y = minY + random() * (maxY - minY);
    // Reserve the whole flight, including its tail and glow, around the content.
    const flight = { left: x - tailX, top: y - tailY, right: x + dx, bottom: y + dy };
    const obscuresContent = quietRegions.some(rect =>
      flight.left < rect.right + 32 && flight.right > rect.left - 32 &&
      flight.top < rect.bottom + 32 && flight.bottom > rect.top - 32);
    if (obscuresContent) continue;
    return { x, y, dx, dy, angle, tail, size: 4.8 + random() * .8, duration: 1100 + random() * 300 };
  }
  return null;
}

export function connectShootingStars(surface: HTMLElement, field: HTMLElement, star: HTMLElement) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let playing = false;
  let first = true;
  let timer = 0;

  const stop = () => {
    window.clearTimeout(timer);
    timer = 0;
    delete star.dataset.shooting;
  };
  const schedule = () => {
    if (!playing || timer || star.dataset.shooting) return;
    const delay = first ? 8000 + Math.random() * 4000 : 16000 + Math.random() * 10000;
    timer = window.setTimeout(launch, delay);
  };
  const launch = () => {
    timer = 0;
    if (!playing) return;
    const bounds = field.getBoundingClientRect();
    const quietRegions = Array.from(surface.querySelectorAll('.hero-test__offer, .hero-test__nav'), element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left - bounds.left, top: rect.top - bounds.top, right: rect.right - bounds.left, bottom: rect.bottom - bounds.top };
    });
    const path = createShootingStar(bounds.width, bounds.height, quietRegions);
    first = false;
    if (!path) { schedule(); return; }
    for (const [property, value] of Object.entries(path)) {
      const unit = property === 'angle' ? 'deg' : property === 'duration' ? 'ms' : 'px';
      star.style.setProperty(`--shooting-${property}`, `${value}${unit}`);
    }
    star.dataset.shooting = 'true';
  };
  const finish = (event: AnimationEvent) => {
    if (event.target !== star || event.animationName !== 'hero-shooting-star') return;
    delete star.dataset.shooting;
    schedule();
  };
  const updatePlayback = () => {
    const next = inView && !document.hidden && !motion.matches;
    if (next === playing) return;
    playing = next;
    if (playing) schedule();
    else stop();
  };
  const resize = () => { stop(); schedule(); };
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  observer.observe(surface);
  star.addEventListener('animationend', finish);
  document.addEventListener('visibilitychange', updatePlayback);
  motion.addEventListener('change', updatePlayback);
  window.addEventListener('resize', resize);

  return () => {
    playing = false;
    stop();
    observer.disconnect();
    star.removeEventListener('animationend', finish);
    document.removeEventListener('visibilitychange', updatePlayback);
    motion.removeEventListener('change', updatePlayback);
    window.removeEventListener('resize', resize);
  };
}
