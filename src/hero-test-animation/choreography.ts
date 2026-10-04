import { desktopProjection, desktopShading } from '../desktopProjection.ts';

export const hardware = { width: 821.739, depth: 547.826 };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const blend = (a: number, b: number, t: number) => a + (b - a) * t;
// Zero velocity and acceleration at both ends keeps the overlapping movements
// continuous, including while reversing across a choreography boundary.
export function ease(value: number) {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function scenePose(progress: number, width: number, height: number, openingHeight = height) {
  const p = clamp(Number.isFinite(progress) ? progress : 0);
  const reveal = ease(p / .55);
  const orbit = ease((p - .035) / .70);
  const close = ease((p - .19) / .70);
  const settle = ease((p - .77) / .23);
  const size = Math.min(1.12, width * .60 / hardware.width, Math.max(.35, (height - 220) / hardware.depth));
  const yaw = -22 * orbit + 6 * settle;
  const lift = ease((p - .28) / .25) * (1 - ease((p - .76) / .24));
  return {
    scaleX: blend(width / hardware.width, size, reveal),
    scaleY: blend(openingHeight / hardware.depth, size, reveal),
    scaleZ: blend(width / hardware.width, size, reveal),
    hingeY: blend(openingHeight, height * .70, reveal) - height * .20 * ease((p - .35) / .65) - height * .11 * lift,
    // Keep the centre of mass in frame as the deck projects toward the camera.
    x: -Math.sin(yaw * Math.PI / 180) * hardware.depth * size * .58,
    pitch: -26 * orbit,
    yaw,
    roll: -5 * Math.sin(orbit * Math.PI * .7),
    fold: 90 * close,
    metal: ease(p / .13),
    title: ease((p - .57) / .21),
    finish: ease((p - .89) / .11),
    reveal,
  };
}

/** A live-DOM approximation of the app's screen-local projection. The upper
 * edge narrows and extends above the aperture; the bottom stays at the hinge.
 * This counter-projection is separate from the physical lid's rotation. */
export function screenPose(degrees: number, width: number, height: number) {
  const projection = desktopProjection(degrees);
  const shading = desktopShading(degrees, height);
  const topHeight = 4 / (4 * projection.cosine - .1 * projection.sine);
  const topWidth = Math.max(.1, 1 - (1 - projection.topWidth) * topHeight);
  const inset = (1 - topWidth) / 2;
  const top = 1 - topHeight;
  const matrix = [
    topWidth, 0, 0, 0,
    -inset * width / height, topWidth - top, 0, (topWidth - 1) / height,
    0, 0, 1, 0,
    inset * width, top * height, 0, 1,
  ];
  return {
    matrix,
    blur: shading.frost * .018,
    frost: shading.frost * .050,
    shadow: shading.broadShadow * .83,
    contact: shading.contactShadow * .85,
    contactWidth: shading.contactWidth * 100,
  };
}
