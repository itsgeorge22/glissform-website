import { ease } from './choreography.ts';
import { phase } from './featureDemoMotion.ts';

// A seeded scatter keeps SSR and hydration identical. Every piece has its own
// flight, tumble and fade height; the shared demo clock drives the whole burst.
let seed = 0x674c15;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const colors = ['#34c759', '#70dfaa', '#48a7ff', '#a68bfa', '#ffca58', '#ff8d9b'];
const maxFadeDepth = 260;
export const updateConfetti = Array.from({ length: 44 }, (_, index) => {
  // Stratify one wide fan, with jitter, instead of two separate fountains.
  const spread = ((index + random()) / 44) * 2 - 1;
  const fadeEnd = 24 + random() * (maxFadeDepth - 24);
  return {
    color: colors[index % colors.length],
    width: 5 + random() * 3,
    height: 8 + random() * 5,
    round: index % 7 === 0,
    delay: random() * .1,
    rise: .5 + random() * .2,
    fall: 1.3 + random() * .5,
    apex: -110 - random() * 100,
    reachX: spread * 286,
    sway: 5 + random() * 10,
    wave: random() * Math.PI * 2,
    fadeStart: fadeEnd * (.3 + random() * .35),
    fadeEnd,
    rotation: random() * 360,
    spin: (random() > .5 ? 1 : -1) * (240 + random() * 400),
    flip: 240 + random() * 360,
  };
});
export const updateConfettiDuration = Math.max(...updateConfetti.map(piece => piece.delay + piece.rise + piece.fall));
type ConfettiPiece = typeof updateConfetti[number];

export function updateConfettiPose(piece: ConfettiPiece, seconds: number, cardHeight: number, fadeRoom = maxFadeDepth) {
  const age = seconds - piece.delay;
  const falling = age >= piece.rise;
  const rise = phase(age, 0, piece.rise), fall = phase(age, piece.rise, piece.fall);
  // Fit the entire varied fade range above the panel edge in shorter windows.
  // Scaling the range preserves variation instead of clipping many pieces at one Y.
  const fadeScale = Math.min(1, Math.max(1, fadeRoom) / maxFadeDepth);
  const fadeStart = piece.fadeStart * fadeScale, fadeEnd = piece.fadeEnd * fadeScale;
  const y = falling ? piece.apex + (cardHeight + fadeEnd - piece.apex) * fall ** 1.7
    : cardHeight * .6 + (piece.apex - cardHeight * .6) * (1 - (1 - rise) ** 2);
  const x = piece.reachX * (1 - Math.exp(-Math.max(0, age) * 3)) / (1 - Math.exp(-(piece.rise + piece.fall) * 3))
    + piece.sway * Math.sin(age * 5 + piece.wave) * fall;
  const fade = falling ? Math.max(0, 1 - ease(phase(y, cardHeight + fadeStart, fadeEnd - fadeStart))) : 1;
  return {
    x, y,
    opacity: age < 0 || age >= piece.rise + piece.fall ? 0 : fade,
    front: falling,
    rotation: piece.rotation + Math.max(0, age) * piece.spin,
    flip: Math.max(0, age) * piece.flip,
  };
}
