import { drawScreenFormation, heroPreludeTiming } from './heroScreenFormation.ts';
import { elementDesignScale } from './designScale.ts';

/** Driven by the hero's existing entrance clock; owns no additional frame loop. */
export function createHeroPrelude(content: HTMLElement) {
  const surface = content.closest<HTMLElement>('.hero-animation__surface')!;
  const screen = surface.querySelector<HTMLElement>('.hero-test__screen')!;
  const frame = surface.querySelector<HTMLElement>('.hero-test__frame')!;
  const notch = surface.querySelector<HTMLElement>('.hero-test__notch')!;
  const glow = content.querySelector<HTMLElement>('.hero-prelude__glow')!;
  const field = content.querySelector<HTMLElement>('.hero-test__stars')!;
  const width = content.clientWidth, height = content.clientHeight;
  const scale = elementDesignScale(content);
  let done = false;
  let stars: { element: HTMLElement; x: number; y: number }[] = [];
  const seed = () => {
    stars = Array.from(field.querySelectorAll<HTMLElement>('.ambient-star')).map(star => ({
      element: star.querySelector<HTMLElement>('.ambient-star__wave')!,
      x: parseFloat(star.style.left), y: parseFloat(star.style.top),
    }));
    for (const { element } of stars) element.style.opacity = '0';
  };
  // Stars mount after their first size measurement. Observe their children,
  // without letting animation style writes trigger another measurement.
  const observer = new MutationObserver(seed);
  observer.observe(field, { childList: true });
  seed();
  const finish = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    surface.dataset.prelude = 'complete';
    for (const [element, properties] of [
      [surface, ['background-color']],
      [screen, ['transform', 'border-radius']],
      [frame, ['transform', 'border-radius', 'opacity', 'box-shadow']],
      [notch, ['translate', 'scale', 'opacity']],
      [glow, ['opacity', 'transform']], [field, ['opacity']],
    ] as [HTMLElement, string[]][]) {
      for (const property of properties) element.style.removeProperty(property);
    }
    for (const { element } of stars) {
      for (const property of ['translate', 'opacity', 'scale', 'filter']) element.style.removeProperty(property);
    }
  };
  const draw = (time: number) => {
    if (done) return;
    if (time >= heroPreludeTiming.duration) { finish(); return; }
    surface.dataset.prelude = 'running';
    drawScreenFormation(time, { surface, screen, frame, notch, glow, field, width, height, stars, scale });
  };
  return { draw, finish };
}
