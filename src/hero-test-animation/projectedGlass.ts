import { unprojectPlanePoint } from './projectedPointer';
import { cancelHeroFrame, getHeroScreenProjection, registerHeroInteraction, requestSceneFrame, type HeroScreenProjection } from './frameSync';

/** The local navigation retains the shared materials, with one pointer handler.
 * Read the button's screen-local bounds only when layout changes. */
export function connectProjectedGlass(surface: HTMLElement) {
  const link = surface.querySelector<HTMLAnchorElement>('.download-link--secondary');
  const desktop = surface.querySelector<HTMLElement>('.hero-animation__desktop');
  if (!link || !desktop) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let bounds = { left: 0, top: 0, width: 1, height: 1 };
  let fallback: HeroScreenProjection | null = null;
  let measureFrame = 0, inside = false, x = 0, y = 0;
  let previousU = NaN, previousV = NaN;

  const measure = () => {
    measureFrame = 0;
    let left = 0, top = 0;
    for (let node: HTMLElement | null = link; node && node !== desktop; node = node.offsetParent as HTMLElement | null) {
      left += node.offsetLeft; top += node.offsetTop;
      const parent = node.offsetParent as HTMLElement | null;
      if (parent && parent !== desktop) { left += parent.clientLeft; top += parent.clientTop; }
      const transform = getComputedStyle(node).transform;
      if (transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        left += matrix.m41; top += matrix.m42;
      }
    }
    const computed = getComputedStyle(link);
    bounds = { left, top, width: Number.parseFloat(computed.width) || link.offsetWidth, height: Number.parseFloat(computed.height) || link.offsetHeight };
    if (!getHeroScreenProjection()) {
      const rect = desktop.getBoundingClientRect();
      fallback = { width: desktop.clientWidth, height: desktop.clientHeight, interactive: true, quad: [
        { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom },
      ] };
    }
    previousU = NaN; previousV = NaN;
    interaction.request();
  };
  const reset = () => {
    inside = false;
    if (!Number.isNaN(previousU) || !Number.isNaN(previousV)) {
      link.style.removeProperty('--glass-rotate-x');
      link.style.removeProperty('--glass-rotate-y');
      previousU = NaN; previousV = NaN;
    }
  };
  const resetFocus = () => {
    reset();
    link.style.removeProperty('--glass-x'); link.style.removeProperty('--glass-y');
  };
  const interaction = registerHeroInteraction(projection => {
    if (!inside) return;
    const plane = projection ?? fallback;
    if (surface.inert || !plane?.interactive || document.hidden || motion.matches || !pointer.matches) { resetFocus(); return; }
    const point = unprojectPlanePoint({ x, y }, plane.quad, plane.width, plane.height);
    if (!point) { reset(); return; }
    const u = Math.max(0, Math.min(1, (point.x - bounds.left) / bounds.width));
    const v = Math.max(0, Math.min(1, (point.y - bounds.top) / bounds.height));
    if (u !== previousU) {
      link.style.setProperty('--glass-x', `${u * 100}%`);
      link.style.setProperty('--glass-rotate-y', `${(u - .5) * 8}deg`);
      previousU = u;
    }
    if (v !== previousV) {
      link.style.setProperty('--glass-y', `${v * 100}%`);
      link.style.setProperty('--glass-rotate-x', `${(.5 - v) * 6}deg`);
      previousV = v;
    }
  });
  const move = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || motion.matches || !pointer.matches || document.hidden) return;
    inside = true; x = event.clientX; y = event.clientY;
    interaction.request();
  };
  const resize = () => {
    reset();
    if (!measureFrame) measureFrame = requestSceneFrame(measure);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(desktop);
  observer.observe(link);
  const nav = link.closest('.hero-test__nav');
  if (nav) observer.observe(nav);
  measure();
  link.addEventListener('pointerenter', move);
  link.addEventListener('pointermove', move);
  link.addEventListener('pointerleave', reset);
  link.addEventListener('pointercancel', reset);
  link.addEventListener('blur', resetFocus);
  window.addEventListener('blur', resetFocus);
  document.addEventListener('visibilitychange', resetFocus);
  motion.addEventListener('change', resetFocus);
  pointer.addEventListener('change', resetFocus);
  return () => {
    resetFocus(); observer.disconnect(); interaction.dispose(); cancelHeroFrame(measureFrame);
    link.removeEventListener('pointerenter', move);
    link.removeEventListener('pointermove', move);
    link.removeEventListener('pointerleave', reset);
    link.removeEventListener('pointercancel', reset);
    link.removeEventListener('blur', resetFocus);
    window.removeEventListener('blur', resetFocus);
    document.removeEventListener('visibilitychange', resetFocus);
    motion.removeEventListener('change', resetFocus);
    pointer.removeEventListener('change', resetFocus);
  };
}
