export function starRipple(x: number, y: number, originX: number, originY: number) {
  const dx = x - originX;
  const dy = y - originY;
  const distance = Math.hypot(dx, dy);
  if (distance >= 660) return null;
  const strength = (1 - distance / 660) ** .7;
  const displacement = 24 * strength;
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

export function connectStarRipples(surface: HTMLElement, field: HTMLElement) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const screen = surface.querySelector('.hero-test__screen');
  const animations = new Map<HTMLElement, Animation>();
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
    if (y < 48) return;
    field.querySelectorAll<HTMLElement>('.ambient-star').forEach(star => {
      const wave = star.querySelector<HTMLElement>('.ambient-star__wave');
      const ripple = starRipple(star.offsetLeft, star.offsetTop, x, y);
      if (!wave || !ripple || Number(star.style.opacity) === 0) return;
      animations.get(wave)?.cancel();
      // A separate wrapper composes with pointer attraction and the core's twinkle.
      const animation = wave.animate([
        { transform: 'translate(0, 0) scale(1)', filter: 'brightness(1)', offset: 0 },
        { transform: `translate(${ripple.x}px, ${ripple.y}px) scale(${ripple.scale})`, filter: `brightness(${ripple.brightness})`, offset: .28 },
        { transform: `translate(${-ripple.x * .12}px, ${-ripple.y * .12}px) scale(1)`, filter: 'brightness(1)', offset: .72 },
        { transform: 'translate(0, 0) scale(1)', filter: 'brightness(1)', offset: 1 },
      ], { duration: 1050, delay: ripple.delay, easing: 'ease-in-out' });
      animations.set(wave, animation);
      animation.onfinish = () => {
        if (animations.get(wave) === animation) animations.delete(wave);
      };
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
