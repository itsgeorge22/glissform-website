import { compose, facesCamera, identity, multiply, projectQuad, translate } from '../hero-test-animation/sceneProjection.ts';
import { hardware, scenePose } from './choreography.ts';
import { displayDimensions as display, displayMapping, macBookDimensions as body } from './displayGeometry.ts';

const scale = (x: number, y: number, z = 1) => { const m = identity(); m[0] = x; m[5] = y; m[10] = z; return m; };
const rotate = (axis: 'x' | 'y' | 'z', degrees: number) => {
  const c = Math.cos(degrees * Math.PI / 180), s = Math.sin(degrees * Math.PI / 180);
  if (axis === 'x') return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  if (axis === 'y') return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

const corners = (min: number[], max: number[]) => [min[0], max[0]].flatMap(x =>
  [min[1], max[1]].flatMap(y => [min[2], max[2]].map(z => [x, y, z])));
const baseCorners = [
  ...corners([(900 - body.width) / 2, body.depth + 3, 0], [(900 + body.width) / 2, body.depth + 9, body.depth]),
  ...corners([(900 - body.width) / 2 + 11, body.depth + 20, 11], [(900 + body.width) / 2 - 11, body.depth + 20, body.depth - 11]),
  ...corners([100, body.depth + 23, 12], [800, body.depth + 23, body.depth - 12]),
];
const lidCorners = corners([-body.width / 2, -body.depth, -body.lidRecess - body.lidThickness],
  [body.width / 2, 0, -body.lidRecess]);

/** Keep a single projected silhouette trajectory throughout the reveal. The
 * old camera recentered the folding lid, then moved it back down for the title. */
function projectedPoints(model: number[], fold: number, width: number, height: number, perspective: number) {
  const a = fold * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return [...baseCorners, ...lidCorners.map(([x, y, z]) =>
    [450 + x, body.depth + body.hingeDrop + y * c + z * s, -y * s + z * c])]
    .map(([x, y, z]) => {
      return {
        x: model[0] * x + model[4] * y + model[8] * z + model[12] - width / 2,
        y: model[1] * x + model[5] * y + model[9] * z + model[13] - height / 2,
        ray: 1 - (model[2] * x + model[6] * y + model[10] * z + model[14]) / perspective,
      };
    });
}

function frameHardware(model: number[], opening: number[], pose: ReturnType<typeof scenePose>, width: number, height: number, perspective: number) {
  if (!pose.reveal) return;
  const initial = projectedPoints(opening, 0, width, height, perspective);
  const points = projectedPoints(model, pose.fold, width, height, perspective);
  for (const [axis, translation, target, origin] of [
    ['x', 12, pose.centerX, width / 2], ['y', 13, pose.centerY, height / 2],
  ] as const) {
    const start = (Math.min(...initial.map(p => p[axis] / p.ray)) + Math.max(...initial.map(p => p[axis] / p.ray))) / 2;
    const center = start + (target - origin - start) * pose.reveal;
    let offset = 0;
    for (let iteration = 0; iteration < 4; iteration++) {
      let min = points[0], max = points[0];
      for (const point of points) {
        if ((point[axis] + offset) / point.ray < (min[axis] + offset) / min.ray) min = point;
        if ((point[axis] + offset) / point.ray > (max[axis] + offset) / max.ray) max = point;
      }
      offset = (2 * center - min[axis] / min.ray - max[axis] / max.ray) / (1 / min.ray + 1 / max.ray);
    }
    model[translation] += offset;
  }
}

/** Project the original live hero onto the original shell, around the Pro hinge. */
export function sceneProjection(pose: ReturnType<typeof scenePose>, width: number, height: number, openingHeight: number) {
  const perspective = Math.max(2400, width * 2.5);
  const mapping = displayMapping(width, openingHeight);
  const startX = 1 / (mapping.scaleX - body.lidRecess / perspective);
  const distance = 1 + body.lidRecess * startX / perspective;
  const startY = distance / mapping.scaleY;
  const startHinge = height / 2 + (16 - height / 2) * distance
    - startY * (display.top + body.hingeDrop - body.depth);
  const remaining = 1 - pose.reveal;
  const model = compose(translate(width / 2 + pose.x, pose.hingeY + (startHinge - openingHeight) * remaining),
    rotate('x', pose.pitch), rotate('y', pose.yaw), rotate('z', pose.roll),
    scale(pose.scaleX + (startX - width / hardware.width) * remaining,
      pose.scaleY + (startY - openingHeight / hardware.depth) * remaining,
      pose.scaleZ + (startX - width / hardware.width) * remaining),
    translate(-450, -body.depth));
  const opening = compose(translate(width / 2, startHinge), scale(startX, startY, startX), translate(-450, -body.depth));
  frameHardware(model, opening, pose, width, height, perspective);
  const points = projectedPoints(model, pose.fold, width, height, perspective);
  const bounds = {
    left: width / 2 + Math.min(...points.map(p => p.x / p.ray)),
    right: width / 2 + Math.max(...points.map(p => p.x / p.ray)),
    top: height / 2 + Math.min(...points.map(p => p.y / p.ray)),
    bottom: height / 2 + Math.max(...points.map(p => p.y / p.ray)),
  };
  const screen = projectHardwareScreen(model, pose.fold, width, height, openingHeight, perspective);
  const lidTop = height / 2 + Math.min(...points.slice(baseCorners.length).map(p => p.y / p.ray));
  return { model, perspective, screen, bounds, lidTop, visible: facesCamera(projectQuad(screen, width, openingHeight)) };
}

export function projectHardwareScreen(model: number[], fold: number, width: number, height: number,
  openingHeight: number, perspective: number) {
  const mapping = displayMapping(width, openingHeight);
  const camera = identity(); camera[11] = -1 / perspective;
  const projection = compose(translate(width / 2, height / 2), camera, translate(-width / 2, -height / 2));
  const physical = compose(model, translate(450, body.depth + body.hingeDrop), rotate('x', -fold),
    translate(mapping.x - body.width / 2, mapping.y - body.depth, -body.lidRecess),
    scale(mapping.scaleX, mapping.scaleY));
  return multiply(projection, physical);
}

/** Find when the moving lid first clears a copy block's layout position.
 * Use the same projected shell and final layout as the rendered scene, so the
 * cue adapts to viewport fitting and reverses without a separate timer. */
export function lidClearProgress(width: number, height: number, openingHeight: number,
  endingScale: number, endingTranslationY: number, copyTop: number) {
  let before = 0, after = 1;
  for (let iteration = 0; iteration < 24; iteration++) {
    const progress = (before + after) / 2;
    const pose = scenePose(progress, width, height, openingHeight);
    const { lidTop } = sceneProjection(pose, width, height, openingHeight);
    const top = lidTop * (1 + (endingScale - 1) * pose.reveal) + endingTranslationY * pose.reveal;
    if (top < copyTop) before = progress;
    else after = progress;
  }
  return after;
}
