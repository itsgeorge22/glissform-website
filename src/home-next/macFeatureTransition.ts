import { ease, scenePose } from './choreography.ts';
import { macBookDimensions as body } from './displayGeometry.ts';
import { projectHardwareScreen, sceneProjection } from './sceneProjection.ts';
import { compose, facesCamera, identity, projectQuad, translate } from '../hero-test-animation/sceneProjection.ts';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const whiteStart = .75;
const handoffScrollNudge = 24;

export const macFeatureHoldDistance = (height: number) => height * .5;

/** Hide the features over a longer scroll interval before reversing the hardware. */
export function macFeatureReturnPose(progress: number, height: number, distance: number) {
  const p = clamp(progress);
  const exitSpan = Math.min(.4, Math.max(192, Math.min(480, height * .4)) / distance);
  const boundary = 1 - exitSpan;
  return {
    scene: clamp(p / boundary),
    content: clamp((p - boundary) / exitSpan),
  };
}

/** Close while the whole silhouette is still readable; tilt and zoom keep building. */
export function macFeaturePose(progress: number) {
  const p = clamp(progress);
  return {
    fold: 62 + 28 * ease(p / .24),
    pitch: -20 - 70 * ease(p / .74),
    approach: p * p,
    center: ease(p / .72),
    shadow: 1 - ease(p / .32),
  };
}

const point = (matrix: number[], [x, y, z]: number[]) => [
  matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
  matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
  matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
];

function lidPoint(fold: number, x = 0, y = 0) {
  const angle = fold * Math.PI / 180, ly = -body.depth / 2 + y, lz = -body.lidRecess - 6.07;
  return [450 + x, body.depth + body.hingeDrop + ly * Math.cos(angle) + lz * Math.sin(angle),
    -ly * Math.sin(angle) + lz * Math.cos(angle)];
}

/** Convert the existing canvas layout into the equivalent camera-space matrix.
 * This keeps the handoff exact while rendering the close-up at viewport resolution. */
function cameraLayout(width: number, height: number, perspective: number, scale: number, y: number) {
  const layout = identity();
  layout[0] = layout[5] = scale;
  layout[12] = (1 - scale) * width / 2;
  layout[13] = y;
  layout[9] = -((scale - 1) * height / 2 + y) / perspective;
  return layout;
}

export function createMacFeatureTransition(width: number, height: number, openingHeight: number,
  endingScale: number, endingTranslationY: number) {
  const ending = scenePose(1, width, height, openingHeight);
  const initial = sceneProjection(ending, width, height, openingHeight);
  const perspective = initial.perspective;
  const layout = cameraLayout(width, height, perspective, endingScale, endingTranslationY);
  const project = ([x, y, z]: number[]) => ({
    x: width / 2 + (x - width / 2) / (1 - z / perspective),
    y: height / 2 + (y - height / 2) / (1 - z / perspective),
  });
  const startLogo = project(point(compose(layout, initial.model), lidPoint(ending.fold)));
  const flat = compose(layout, sceneProjection({ ...ending, fold: 90, pitch: -90 }, width, height, openingHeight).model);
  const logoHeight = Math.abs(project(point(flat, lidPoint(90, 0, 45))).y - project(point(flat, lidPoint(90, 0, -45))).y);
  // Keep the original camera calibration even though the visible approach ends earlier.
  const zoomReference = Math.max(1, height * 1.45 / logoHeight);

  const projectApproach = (progress: number) => {
    const motion = macFeaturePose(progress);
    const projection = sceneProjection({ ...ending, ...motion }, width, height, openingHeight);
    const fitted = compose(layout, projection.model);
    const logo = point(fitted, lidPoint(motion.fold));
    const zoom = Math.exp(Math.log(zoomReference) * motion.approach);
    const distance = (perspective - logo[2]) / zoom;
    const targetY = startLogo.y + (height / 2 - startLogo.y) * motion.center;
    // Dolly toward the actual mark, maintaining its screen anchor as perspective changes.
    const model = compose(translate(width / 2 - logo[0],
      height / 2 + (targetY - height / 2) * distance / perspective - logo[1],
      perspective - distance - logo[2]), fitted);
    const screen = projectHardwareScreen(model, motion.fold, width, height, openingHeight, perspective);
    const markHeight = Math.abs(project(point(model, lidPoint(motion.fold, 0, 45))).y
      - project(point(model, lidPoint(motion.fold, 0, -45))).y);
    return { ...motion, model, screen, perspective, zoom,
      logo: project(point(model, lidPoint(motion.fold))), logoHeight: markHeight,
      visible: facesCamera(projectQuad(screen, width, openingHeight)),
    };
  };

  // The full-screen pose arrives earlier in tall viewports. Find it from the
  // projected lid edges before applying the small handoff nudge.
  const halfWidth = body.width / 2;
  const halfDepth = body.depth / 2;
  const corners = [[-halfWidth, -halfDepth], [halfWidth, -halfDepth],
    [halfWidth, halfDepth], [-halfWidth, halfDepth]];
  const viewport = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  const fillsViewport = (progress: number) => {
    const pose = projectApproach(progress);
    const quad = corners.map(([x, y]) => project(point(pose.model, lidPoint(pose.fold, x, y))));
    return viewport.every(corner => {
      const sides = quad.map((a, index) => {
        const b = quad[(index + 1) % quad.length];
        return (b.x - a.x) * (corner.y - a.y) - (b.y - a.y) * (corner.x - a.x);
      });
      return sides.every(value => value >= 0) || sides.every(value => value <= 0);
    });
  };
  let beforeFill = .24, fillProgress = 1;
  for (let iteration = 0; iteration < 24; iteration++) {
    const middle = (beforeFill + fillProgress) / 2;
    if (fillsViewport(middle)) fillProgress = middle;
    else beforeFill = middle;
  }
  // Fixed scroll travel; geometry still determines the final camera pose.
  const distance = 4000;
  // Account for the slower finish so screen fill still happens 24 scroll pixels
  // before the handoff, rather than creating a longer white interval.
  const endProgress = clamp(fillProgress / ease(1 - handoffScrollNudge / distance));
  return {
    endProgress,
    distance,
    project: (progress: number) => ({
      ...projectApproach(ease(clamp(progress)) * endProgress),
      // Finish just after screen fill, with no subsequent white scroll interval.
      white: ease((clamp(progress) - whiteStart) / (1 - whiteStart)),
    }),
  };
}
