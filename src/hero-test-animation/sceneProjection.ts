import { hardware, type scenePose } from './choreography.ts';
import type { PlaneQuad } from './projectedPointer.ts';

export type Matrix = number[];
type Pose = ReturnType<typeof scenePose>;
export const identity = (): Matrix => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export function multiply(a: readonly number[], b: readonly number[]): Matrix {
  const out = Array<number>(16).fill(0);
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++)
    for (let k = 0; k < 4; k++) out[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
  return out;
}
export const compose = (...matrices: Matrix[]) => matrices.reduce(multiply, identity());
export function translate(x: number, y: number, z = 0): Matrix {
  const m = identity(); m[12] = x; m[13] = y; m[14] = z; return m;
}
function scale(x: number, y: number, z = 1): Matrix {
  const m = identity(); m[0] = x; m[5] = y; m[10] = z; return m;
}
function rotate(axis: 'x' | 'y' | 'z', degrees: number): Matrix {
  const c = Math.cos(degrees * Math.PI / 180), s = Math.sin(degrees * Math.PI / 180);
  if (axis === 'x') return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  if (axis === 'y') return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
export function projectQuad(matrix: readonly number[], width: number, height: number): PlaneQuad {
  return [[0, 0], [width, 0], [width, height], [0, height]].map(([x, y]) => {
    const w = matrix[3] * x + matrix[7] * y + matrix[15];
    return { x: (matrix[0] * x + matrix[4] * y + matrix[12]) / w,
      y: (matrix[1] * x + matrix[5] * y + matrix[13]) / w };
  }) as unknown as PlaneQuad;
}
export function facesCamera(quad: PlaneQuad) {
  const [a, b, , d] = quad;
  return (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x) > .1;
}

/** One camera supplies both the GPU enclosure and the live, flat DOM display.
 * No nested CSS 3D scene or layout measurement is needed while scrolling. */
export function sceneProjection(pose: Pose, width: number, height: number, openingHeight: number) {
  const perspective = Math.max(2400, width * 2.5);
  const model = compose(translate(width / 2 + pose.x, pose.hingeY),
    rotate('x', pose.pitch), rotate('y', pose.yaw), rotate('z', pose.roll),
    scale(pose.scaleX, pose.scaleY, pose.scaleZ), translate(-450, -hardware.depth));
  const camera = identity(); camera[11] = -1 / perspective;
  const projection = compose(translate(width / 2, height / 2), camera, translate(-width / 2, -height / 2));
  const physical = compose(model, translate(450, hardware.depth), rotate('x', -pose.fold),
    translate(-450, -hardware.depth), translate((900 - hardware.width) / 2, 0),
    scale(hardware.width / width, hardware.depth / openingHeight));
  const screen = multiply(projection, physical);
  return { model, perspective, screen, visible: facesCamera(projectQuad(screen, width, openingHeight)) };
}
