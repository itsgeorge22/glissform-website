import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createHeroStars, type HeroStar, type QuietRegion } from '../hero-test/heroStarLayout';
import { createShootingStar } from '../hero-test/shootingStars';
import { starRipple } from '../hero-test/starRipple';
import { unprojectPlanePoint } from './projectedPointer';
import { cancelHeroFrame, getHeroScreenProjection, registerHeroInteraction, requestSceneFrame, type HeroScreenProjection } from './frameSync';

const starDepths = [2, 5, 8];
type CachedStar = {
  element: HTMLElement; wave: HTMLElement; x: number; y: number;
  opacity: number; depth: number; transform: string; filter: string;
};
type StarLayout = { width: number; height: number; quiet: QuietRegion[]; fallback: HeroScreenProjection | null };

// Read only when layout changes. The desktop retains its original coordinates.
function quietRegions(root: HTMLElement, elements: HTMLElement[]): QuietRegion[] {
  return elements.map(element => {
    let x = 0, y = 0;
    for (let node: HTMLElement | null = element; node && node !== root; node = node.offsetParent as HTMLElement | null) {
      x += node.offsetLeft; y += node.offsetTop;
      const transform = getComputedStyle(node).transform;
      if (transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        x += matrix.m41; y += matrix.m42;
      }
    }
    return { left: x, top: y, right: x + element.offsetWidth, bottom: y + element.offsetHeight };
  });
}

export default function AnimationHeroStarField({ surfaceRef }: { surfaceRef: RefObject<HTMLElement | null> }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const shootingRef = useRef<HTMLElement>(null);
  const nodesRef = useRef(new Map<number, HTMLElement>());
  const cachedStarsRef = useRef<CachedStar[]>([]);
  const layoutRef = useRef<StarLayout>({ width: 0, height: 0, quiet: [], fallback: null });
  const controllerRef = useRef<{ resize(): void; seed(): void } | null>(null);
  const [stars, setStars] = useState<HeroStar[]>([]);

  useEffect(() => {
    const field = fieldRef.current, surface = surfaceRef.current;
    if (!field || !surface) return;
    const root = field.closest<HTMLElement>('.hero-animation__desktop') ?? surface;
    const offers = Array.from(surface.querySelectorAll<HTMLElement>('.hero-test__offer'));
    const protectedElements = [...offers, ...surface.querySelectorAll<HTMLElement>('.hero-test__nav')];
    let frame = 0;
    const measure = () => {
      frame = 0;
      const width = field.clientWidth, height = field.clientHeight;
      let fallback = layoutRef.current.fallback;
      // Once the scene publishes its pose, no DOM rectangles are needed.
      if (!getHeroScreenProjection()) {
        const rect = field.getBoundingClientRect();
        fallback = { width, height, interactive: true, quad: [
          { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top },
          { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom },
        ] };
      }
      layoutRef.current = { width, height, quiet: quietRegions(root, protectedElements), fallback };
      controllerRef.current?.resize();
      setStars(createHeroStars(width, height, quietRegions(root, offers)));
    };
    const observer = new ResizeObserver(() => { if (!frame) frame = requestSceneFrame(measure); });
    observer.observe(field);
    protectedElements.forEach(element => observer.observe(element));
    measure();
    return () => { observer.disconnect(); cancelHeroFrame(frame); };
  }, [surfaceRef]);

  useLayoutEffect(() => {
    // Seed once after React's layout change; pointer frames use this array.
    // Cached offsets preserve the original field's pixel rounding.
    cachedStarsRef.current = stars.flatMap((star, index) => {
      const element = nodesRef.current.get(star.id);
      const wave = element?.firstElementChild as HTMLElement | null;
      return element && wave ? [{
        element, wave, x: element.offsetLeft, y: element.offsetTop,
        opacity: star.opacity, depth: starDepths[index % starDepths.length], transform: '', filter: '',
      }] : [];
    });
    controllerRef.current?.seed();
  }, [stars]);

  useEffect(() => {
    const surface = surfaceRef.current, field = fieldRef.current, shooting = shootingRef.current;
    if (!surface || !field || !shooting) return;
    const screen = surface.querySelector('.hero-test__screen');
    const desktop = field.closest('.hero-animation__desktop');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const ripples = new Map<HTMLElement, Animation>();
    let inView = false, playing = false, firstFlight = true, pointerInside = false, pointerPainted = false;
    let timer = 0, clientX = 0, clientY = 0;

    const pointerPoint = (x: number, y: number, projection = getHeroScreenProjection()) => {
      const plane = projection ?? layoutRef.current.fallback;
      return plane?.interactive ? unprojectPlanePoint({ x, y }, plane.quad, plane.width, plane.height) : null;
    };
    const resetPointer = () => {
      pointerInside = false;
      if (!pointerPainted) return;
      pointerPainted = false;
      for (const star of cachedStarsRef.current) {
        star.element.style.removeProperty('transform'); star.element.style.removeProperty('filter');
        star.transform = ''; star.filter = '';
      }
    };
    const clearRipples = () => { ripples.forEach(animation => animation.cancel()); ripples.clear(); };
    const paintPointer = (projection: HeroScreenProjection | null) => {
      if (!playing || !finePointer.matches || !pointerInside) return;
      const point = pointerPoint(clientX, clientY, projection);
      const { width, height } = layoutRef.current;
      if (!point || point.x < -16 || point.y < -16 || point.x > width + 16 || point.y > height + 16) { resetPointer(); return; }
      const reach = Math.max(220, Math.min(300, width * .16));
      const viewX = Math.max(-1, Math.min(1, point.x / width * 2 - 1));
      const viewY = Math.max(-1, Math.min(1, point.y / height * 2 - 1));
      for (const star of cachedStarsRef.current) {
        const dx = point.x - star.x, dy = point.y - star.y;
        const influence = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
        const scale = 1 + 1.1 * influence * influence * (3 - 2 * influence);
        const transform = `translate(${dx * influence * .18 - viewX * star.depth}px, ${dy * influence * .18 - viewY * star.depth}px) scale(${scale})`;
        const filter = `brightness(${1 + influence * 1.8})`;
        if (star.transform !== transform) { star.element.style.transform = transform; star.transform = transform; }
        if (star.filter !== filter) { star.element.style.filter = filter; star.filter = filter; }
      }
      pointerPainted = true;
    };
    const movePointer = (event: PointerEvent) => {
      if (!playing || !finePointer.matches || event.pointerType === 'touch') return;
      clientX = event.clientX; clientY = event.clientY; pointerInside = true;
      interaction.request();
    };
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || !event.detail || !playing || (event.target !== screen && event.target !== desktop)) return;
      const point = pointerPoint(event.clientX, event.clientY);
      const { width, height } = layoutRef.current;
      if (!point || point.y < 48 || point.x < 0 || point.x > width || point.y > height) return;
      for (const star of cachedStarsRef.current) {
        const { wave } = star;
        const ripple = starRipple(star.x, star.y, point.x, point.y);
        if (!ripple || star.opacity === 0) continue;
        ripples.get(wave)?.cancel();
        const animation = wave.animate([
          { transform: 'translate(0, 0) scale(1)', filter: 'brightness(1)', offset: 0 },
          { transform: `translate(${ripple.x}px, ${ripple.y}px) scale(${ripple.scale})`, filter: `brightness(${ripple.brightness})`, offset: .28 },
          { transform: `translate(${-ripple.x * .12}px, ${-ripple.y * .12}px) scale(1)`, filter: 'brightness(1)', offset: .72 },
          { transform: 'translate(0, 0) scale(1)', filter: 'brightness(1)', offset: 1 },
        ], { duration: 1050, delay: ripple.delay, easing: 'ease-in-out' });
        ripples.set(wave, animation);
        animation.onfinish = () => { if (ripples.get(wave) === animation) ripples.delete(wave); };
      }
    };
    const stopShooting = () => { clearTimeout(timer); timer = 0; delete shooting.dataset.shooting; };
    const schedule = () => {
      if (playing && !timer && !shooting.dataset.shooting) timer = window.setTimeout(launch, firstFlight ? 8000 + Math.random() * 4000 : 16000 + Math.random() * 10000);
    };
    const launch = () => {
      timer = 0;
      if (!playing) return;
      const { width, height, quiet } = layoutRef.current;
      const path = createShootingStar(width, height, quiet);
      firstFlight = false;
      if (!path) { schedule(); return; }
      for (const [property, value] of Object.entries(path)) {
        const unit = property === 'angle' ? 'deg' : property === 'duration' ? 'ms' : 'px';
        shooting.style.setProperty(`--shooting-${property}`, `${value}${unit}`);
      }
      shooting.dataset.shooting = 'true';
    };
    const finish = (event: AnimationEvent) => {
      if (event.target === shooting && event.animationName === 'hero-shooting-star') { delete shooting.dataset.shooting; schedule(); }
    };
    const updatePlayback = (projection = getHeroScreenProjection()) => {
      const next = inView && !document.hidden && !motion.matches && !surface.inert && projection?.interactive !== false;
      // Guard before resets: repeated closed-lid frames do no star-style work.
      if (next === playing) return;
      playing = next;
      field.dataset.playing = String(next);
      if (playing) schedule();
      else { resetPointer(); clearRipples(); stopShooting(); }
    };
    const interaction = registerHeroInteraction(projection => { updatePlayback(projection); paintPointer(projection); });
    const reset = () => { resetPointer(); clearRipples(); };
    const visibility = () => { reset(); updatePlayback(); };
    const pointerPreference = () => { if (!finePointer.matches) resetPointer(); interaction.request(); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updatePlayback(); });
    observer.observe(surface);
    controllerRef.current = {
      resize() { reset(); stopShooting(); schedule(); },
      seed() { if (pointerInside) interaction.request(); },
    };
    updatePlayback();
    surface.addEventListener('pointermove', movePointer);
    surface.addEventListener('pointerleave', resetPointer);
    surface.addEventListener('pointercancel', resetPointer);
    surface.addEventListener('click', click);
    shooting.addEventListener('animationend', finish);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', visibility);
    finePointer.addEventListener('change', pointerPreference);
    return () => {
      playing = false; reset(); stopShooting();
      interaction.dispose(); observer.disconnect(); controllerRef.current = null;
      delete field.dataset.playing;
      surface.removeEventListener('pointermove', movePointer);
      surface.removeEventListener('pointerleave', resetPointer);
      surface.removeEventListener('pointercancel', resetPointer);
      surface.removeEventListener('click', click);
      shooting.removeEventListener('animationend', finish);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', visibility);
      finePointer.removeEventListener('change', pointerPreference);
    };
  }, [surfaceRef]);

  return <div className="hero-test__stars" ref={fieldRef} aria-hidden="true" data-playing="false">
    {stars.map(star => <i className="ambient-star" key={star.id}
      ref={element => { if (element) nodesRef.current.set(star.id, element); else nodesRef.current.delete(star.id); }}
      style={{
        left: `${star.x}px`, top: `${star.y}px`, opacity: star.opacity,
        '--spark-size': `${star.size}px`, '--spark-duration': `${star.duration}s`, '--spark-delay': `${star.delay}s`,
      } as CSSProperties}><span className="ambient-star__wave"><b className="ambient-star__core" /></span></i>)}
    <i className="hero-test__shooting-star" ref={shootingRef} />
  </div>;
}
