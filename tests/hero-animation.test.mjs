import test from 'node:test';
import assert from 'node:assert/strict';
import { hardware, scenePose, screenPose } from '../src/hero-test-animation/choreography.ts';

const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('opening maps the native lid back to the complete original viewport', () => {
  for (const [width, height] of [[1156, 720], [1440, 900], [1920, 1080]]) {
    const pose = scenePose(0, width, height);
    near(pose.scaleX * hardware.width, width);
    near(pose.scaleY * hardware.depth, height);
    near(pose.hingeY, height);
    for (const key of ['x', 'pitch', 'yaw', 'roll', 'fold', 'metal', 'title', 'finish']) near(pose[key], 0);
    assert.deepEqual(screenPose(0, width - 32, height - 32).matrix.map(v => v || 0), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }
});

test('a single reversible gesture reveals the laptop before closing and seats the lid', () => {
  near(scenePose(.19, 1440, 900).fold, 0);
  assert.ok(scenePose(.19, 1440, 900).reveal > .2);
  near(scenePose(1, 1440, 900).fold, 90);
  let lastFold = 0;
  const forward = Array.from({length: 1001}, (_, i) => scenePose(i / 1000, 1440, 900));
  forward.forEach(pose => {
    assert.ok(pose.fold >= lastFold);
    assert.ok(Object.values(pose).every(Number.isFinite));
    lastFold = pose.fold;
  });
  for (let i = 1000; i >= 0; i--) assert.deepEqual(scenePose(i / 1000, 1440, 900), forward[i]);
});

test('short windows keep the original 720px hero but frame the closing pose within the viewport', () => {
  const opening = scenePose(0, 1440, 600, 720);
  near(opening.scaleY * hardware.depth, 720);
  near(opening.hingeY, 720);
  assert.deepEqual(scenePose(1, 1440, 600, 720), scenePose(1, 1440, 600, 600));
});

test('screen counter-projection holds both hinge corners and narrows its raised top', () => {
  const width = 1408, height = 868;
  const project = (m, x, y) => {
    const w = m[3] * x + m[7] * y + m[15];
    return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
  };
  for (let angle = 0; angle <= 90; angle++) {
    const pose = screenPose(angle, width, height);
    const left = project(pose.matrix, 0, height), right = project(pose.matrix, width, height);
    near(left[0], 0); near(left[1], height);
    near(right[0], width); near(right[1], height);
    const upperLeft = project(pose.matrix, 0, 0), upperRight = project(pose.matrix, width, 0);
    assert.ok(upperLeft[1] <= 0);
    assert.ok(upperLeft[0] >= 0 && upperRight[0] <= width);
    assert.ok(pose.matrix.every(Number.isFinite));
    assert.ok(pose.blur >= 0 && pose.shadow >= 0 && pose.shadow <= 1);
  }
});

test('phase boundaries do not introduce a spatial jump', () => {
  for (const boundary of [0, .035, .13, .19, .35, .55, .70, .735, .77, .89, .90, 1]) {
    const a = scenePose(boundary - 1e-6, 1920, 1080);
    const b = scenePose(boundary + 1e-6, 1920, 1080);
    for (const key of Object.keys(a)) assert.ok(Math.abs(a[key] - b[key]) < .02, `${key} jumps at ${boundary}`);
  }
});
