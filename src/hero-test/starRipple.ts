import { elementDesignScale } from '../home-next/designScale';

export function starRipple(x: number, y: number, originX: number, originY: number, scale = 1) {
  const dx = (x - originX) / scale;
  const dy = (y - originY) / scale;
  const distance = Math.hypot(dx, dy);
  if (distance >= 660) return null;
  const strength = (1 - distance / 660) ** .7;
  const displacement = 24 * strength * scale;
  // Hover already enlarges and lights nearby stars; let the click only move them.
  const accentProgress = Math.max(0, Math.min(1, (distance - 120) / 100));
  const accentWeight = accentProgress ** 2 * (3 - 2 * accentProgress);
  return {
    x: distance ? dx / distance * displacement : 0,
    y: distance ? dy / distance * displacement : 0,
    strength,
    scale: 1 + .5 * strength * accentWeight,
    brightness: 1 + 2 * strength * accentWeight,
    delay: distance / .65,
  };
}

/** Each click adds a wave; later clicks never replace an in-flight wave. */
export function playStarRipple(wave: HTMLElement, ripple: NonNullable<ReturnType<typeof starRipple>>, animations: Set<Animation>) {
  const animation = wave.animate([
    { transform: 'translate(0, 0) scale(1)', filter: 'brightness(1)', offset: 0 },
    { transform: `translate(${ripple.x}px, ${ripple.y}px) scale(${ripple.scale})`, filter: `brightness(${ripple.brightness})`, offset: .28 },
    { transform: `translate(${-ripple.x * .12}px, ${-ripple.y * .12}px) scale(1)`, filter: 'brightness(1)', offset: .72 },
    { transform: 'translate(0, 0) scale(1)', filter: 'brightness(1)', offset: 1 },
  ], { duration: 1050, delay: ripple.delay, easing: 'ease-in-out', composite: 'add' });
  animations.add(animation);
  const forget = () => animations.delete(animation);
  animation.onfinish = forget;
  animation.oncancel = forget;
}

export function connectStarRipples(surface: HTMLElement, field: HTMLElement) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const screen = surface.querySelector('.hero-test__screen');
  const animations = new Set<Animation>();
  const clear = () => {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || event.detail === 0 || event.target !== screen
      || motion.matches || document.hidden || field.dataset.playing !== 'true') return;
    const bounds = field.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const scale = elementDesignScale(surface);
    if (y < 48 * scale) return;
    field.querySelectorAll<HTMLElement>('.ambient-star').forEach(star => {
      const wave = star.querySelector<HTMLElement>('.ambient-star__wave');
      const ripple = starRipple(star.offsetLeft, star.offsetTop, x, y, scale);
      if (!wave || !ripple || Number(star.style.opacity) === 0) return;
      playStarRipple(wave, ripple, animations);
    });
  };
  const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) clear(); });
  observer.observe(surface);
  surface.addEventListener('click', click);
  window.addEventListener('resize', clear);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
  motion.addEventListener('change', clear);
  return () => {
    clear();
    observer.disconnect();
    surface.removeEventListener('click', click);
    window.removeEventListener('resize', clear);
    window.removeEventListener('blur', clear);
    document.removeEventListener('visibilitychange', clear);
    motion.removeEventListener('change', clear);
  };
}
