import { ease } from './choreography.ts';
import { phase } from './featureDemoMotion.ts';

/** Roll each digit only as that place changes, including the 99 → 100 carry. */
export function angleDigitPosition(angle: number, place: number) {
  const digit = Math.floor(angle / place) % 10;
  const carry = phase(angle % place, place - 1, 1);
  return digit + ease(carry);
}

export function createAngleCounter(root: HTMLElement) {
  const reels = Array.from(root.querySelectorAll<HTMLElement>('.angle-counter__reel'))
    .map(element => ({ element, place: Number(element.dataset.place) }));
  return (angle: number) => {
    for (const { element, place } of reels) {
      element.style.transform = `translate3d(0, -${angleDigitPosition(angle, place)}em, 0)`;
    }
    reels[0].element.parentElement!.style.width = `${.66 * ease(phase(angle, 99, 1))}em`;
  };
}
