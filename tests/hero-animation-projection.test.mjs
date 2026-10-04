import test from 'node:test';
import assert from 'node:assert/strict';
import { scenePose, screenPose } from '../src/hero-test-animation/choreography.ts';
import { compose, projectQuad, sceneProjection, translate } from '../src/hero-test-animation/sceneProjection.ts';
import { unprojectPlanePoint } from '../src/hero-test-animation/projectedPointer.ts';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('the flat opening maps the live hero exactly onto the viewport at all desktop sizes', () => {
  for (const [width, height] of [[1156, 720], [1178, 960], [1440, 600], [1920, 1080]]) {
    const openingHeight = Math.max(height, 720);
    const { screen, visible } = sceneProjection(scenePose(0, width, height, openingHeight), width, height, openingHeight);
    const corners = projectQuad(screen, width, openingHeight);
    const expected = [[0, 0], [width, 0], [width, openingHeight], [0, openingHeight]];
    corners.forEach((point, i) => { near(point.x, expected[i][0]); near(point.y, expected[i][1]); });
    assert.equal(visible, true);
  }
});

test('camera projection and inverse pointer coordinates agree across the visible closing and reverse gesture', () => {
  for (const [width, height] of [[1178, 960], [1440, 900], [1920, 1080]]) {
    let visibleFrames = 0;
    for (let i = 0; i <= 100; i++) {
      const pose = scenePose(i / 100, width, height);
      const camera = sceneProjection(pose, width, height, height);
      assert.ok(camera.screen.every(Number.isFinite));
      if (!camera.visible) continue;
      visibleFrames++;
      const w = width - 32, h = height - 32;
      const matrix = compose(camera.screen, translate(16, 16), screenPose(pose.fold, w, h).matrix);
      const quad = projectQuad(matrix, w, h);
      const x = w * .7, y = h * .6;
      const divisor = matrix[3] * x + matrix[7] * y + matrix[15];
      const screenPoint = { x: (matrix[0] * x + matrix[4] * y + matrix[12]) / divisor,
        y: (matrix[1] * x + matrix[5] * y + matrix[13]) / divisor };
      const inverse = unprojectPlanePoint(screenPoint, quad, w, h);
      assert.ok(inverse);
      near(inverse.x, x); near(inverse.y, y);
    }
    assert.ok(visibleFrames > 50 && visibleFrames < 90);
    assert.equal(sceneProjection(scenePose(1, width, height), width, height, height).visible, false);
  }
});
