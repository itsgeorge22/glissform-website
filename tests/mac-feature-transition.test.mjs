import test from 'node:test';
import assert from 'node:assert/strict';
import { createMacFeatureTransition, macFeaturePose } from '../src/home-next/macFeatureTransition.ts';
import { settingsFeatureEntrancePose, settingsFeatureEntranceTiming } from '../src/home-next/settingsFeaturesChoreography.ts';
import { scenePose } from '../src/home-next/choreography.ts';
import { sceneProjection } from '../src/home-next/sceneProjection.ts';
import { macBookDimensions as body } from '../src/home-next/displayGeometry.ts';
import { compose, identity, projectQuad } from '../src/hero-test-animation/sceneProjection.ts';

const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance,
  `${actual} differs from ${expected}`);

function scene(width, height) {
  const openingHeight = Math.max(720, height);
  const original = sceneProjection(scenePose(1, width, height, openingHeight), width, height, openingHeight);
  const copyBottom = Math.min(190, Math.max(112, height * .15)) + 32 + 224;
  const modelTop = copyBottom + 128;
  const scale = Math.min(Math.min(1280, width - 128) / (original.bounds.right - original.bounds.left),
    Math.max(96, height - modelTop - 48) / (original.bounds.bottom - original.bounds.top));
  const y = modelTop - original.bounds.top * scale;
  const layout = identity(); layout[0] = layout[5] = scale;
  layout[12] = (1 - scale) * width / 2; layout[13] = y;
  return { original, layout, openingHeight, scale, y, ...createMacFeatureTransition(width, height, openingHeight, scale, y) };
}

test('the second shot begins at the exact final rendered screen pose on every viewport', () => {
  for (const [width, height] of [[1056, 600], [1280, 720], [1440, 900], [1920, 1080], [3440, 1440]]) {
    const { original, layout, openingHeight, project } = scene(width, height);
    const old = projectQuad(compose(layout, original.screen), width, openingHeight);
    const next = projectQuad(project(0).screen, width, openingHeight);
    old.forEach((p, i) => { near(next[i].x, p.x); near(next[i].y, p.y); });
    assert.equal(scene(width, height).distance, 3000);
    assert.equal(project(0).fold, 62);
    assert.equal(project(0).white, 0);
    assert.deepEqual(project(-1), project(0));
    assert.deepEqual(project(2), project(1));
  }
});

test('the dive starts gently, gathers speed through the middle and settles while keeping early closure', () => {
  const { project } = scene(1440, 900);
  const start = project(0), early = project(.05), half = project(.5);
  assert.ok(early.fold > start.fold && early.pitch < start.pitch && early.zoom > start.zoom);
  assert.ok(half.fold > early.fold && half.pitch < early.pitch && half.zoom > early.zoom);
  const closed = project(Array.from({ length: 1001 }, (_, i) => i / 1000)
    .find(progress => project(progress).fold === 90));
  assert.equal(closed.fold, 90, 'the lid closes early in the approach before tilt and zoom dominate');
  assert.ok(closed.pitch > -40 && closed.zoom < 1.3,
    'closure remains visible before the tilt and zoom dominate the silhouette');
  let previousZoom = 0, previousWhite = 0, previousCenterDistance = Infinity;
  const speeds = [];
  for (let i = 0; i <= 100; i++) {
    const pose = project(i / 100);
    near(pose.logo.x, 720);
    const centerDistance = Math.abs(pose.logo.y - 450);
    assert.ok(centerDistance <= previousCenterDistance, 'the camera continues approaching the viewport center');
    previousCenterDistance = centerDistance;
    if (i > 0) {
      const delta = pose.zoom - previousZoom;
      assert.ok(delta > 0, 'the camera never steps backward');
      speeds.push(delta);
    }
    previousZoom = pose.zoom;
    if (i <= 75) assert.equal(pose.white, 0, 'the fade preserves the visible closing and early zoom');
    else assert.ok(pose.white > previousWhite, 'white increases gradually through the final approach');
    previousWhite = pose.white;
  }
  const peak = Math.max(...speeds), peakAt = speeds.indexOf(peak) / speeds.length;
  assert.ok(peakAt > .4 && peakAt < .8, 'peak speed belongs to the middle of the dive');
  assert.ok(speeds[0] < peak * .01 && speeds.at(-1) < peak * .01,
    'the zoom has a gentle start and a genuinely slow finish');
  assert.equal(macFeaturePose(1).fold, 90);
  assert.equal(project(1).white, 1);
  assert.ok(project(1).logoHeight < 900 * .4, 'white finishes while the logo is still small in the full-screen lid');
});

test('the white endpoint follows screen fill in both the screenshot and the taller preview', () => {
  const wide = scene(1280, 720), tall = scene(1118, 1016);
  assert.ok(tall.endProgress < wide.endProgress - .05,
    'a tall viewport must not retain the later screenshot-sized endpoint');
  for (const [view, height] of [[wide, 720], [tall, 1016]]) {
    assert.ok(view.endProgress < .62, 'the small handoff nudge stays close to the selected bright frame');
    const width = view === wide ? 1280 : 1118;
    const fill = 1 - 24 / view.distance;
    near(lidClearance(view.project(fill), width, height), 0, .02);
    assert.ok(lidClearance(view.project(fill - 10 / view.distance), width, height) < 0,
      'the lid does not fill the screen earlier than the retained handoff nudge');
    assert.ok(lidClearance(view.project(1), width, height) > 0);
    assert.equal(view.project(1).white, 1);
    assert.ok(view.project(.9).white > 0 && view.project(.9).white < 1,
      'the fade begins before the full-screen handoff');
  }
});


function lidClearance(pose, width, height) {
  const a = pose.fold * Math.PI / 180, matrix = pose.model;
  const quad = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const x = 450 + sx * body.width / 2, y = (sy - 1) * body.depth / 2;
    const z = -body.lidRecess - 6.07;
    const local = [x, body.depth + body.hingeDrop + y * Math.cos(a) + z * Math.sin(a),
      -y * Math.sin(a) + z * Math.cos(a)];
    const world = [0, 1, 2].map(row => matrix[row] * local[0] + matrix[4 + row] * local[1]
      + matrix[8 + row] * local[2] + matrix[12 + row]);
    const ray = 1 - world[2] / pose.perspective;
    return { x: width / 2 + (world[0] - width / 2) / ray,
      y: height / 2 + (world[1] - height / 2) / ray };
  });
  const area = quad.reduce((sum, p, i) => {
    const next = quad[(i + 1) % 4];
    return sum + p.x * next.y - p.y * next.x;
  }, 0);
  return Math.min(...[[0, 0], [width, 0], [width, height], [0, height]].flatMap(([x, y]) =>
    quad.map((a, i) => {
      const b = quad[(i + 1) % 4];
      return Math.sign(area) * ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x))
        / Math.hypot(b.x - a.x, b.y - a.y);
    })));
}

test('the entire approach remains finite, reversible and in front of the camera near plane', () => {
  for (const [width, height] of [[1056, 600], [1280, 720], [1920, 1080]]) {
    const { project } = scene(width, height);
    const forward = Array.from({ length: 101 }, (_, i) => project(i / 100));
    for (let i = 100; i >= 0; i--) {
      const pose = project(i / 100), matrix = pose.model;
      assert.deepEqual(pose, forward[i], 'reverse scroll retraces the exact same pose');
      assert.ok([...matrix, ...pose.screen, pose.zoom, pose.white].every(Number.isFinite));
      const radians = pose.fold * Math.PI / 180;
      for (const x of [-body.width / 2, body.width / 2]) for (const y of [-body.depth, 0]) {
        const z = -body.lidRecess - body.lidThickness;
        const local = [450 + x, body.depth + body.hingeDrop + y * Math.cos(radians) + z * Math.sin(radians),
          -y * Math.sin(radians) + z * Math.cos(radians)];
        const depth = matrix[2] * local[0] + matrix[6] * local[1] + matrix[10] * local[2] + matrix[14];
        assert.ok(pose.perspective - depth > 2, 'no lid corner crosses the camera during the push-in');
      }
    }
  }
});


test('returning features overlap the same reversing camera and never leave an opaque white stopping point', () => {
  for (const [width, height] of [[1280, 720], [1118, 1016], [1920, 1017]]) {
    const view = scene(width, height);
    const oldBlankPosition = 1 - Math.max(192, Math.min(480, height * .4)) / view.distance;
    const oldBlank = view.project(oldBlankPosition);
    assert.ok(oldBlank.white < 1);
    assert.ok(settingsFeatureEntrancePose(settingsFeatureEntranceTiming.duration * oldBlank.white ** 2).opacity > .9 || oldBlank.white < .5,
      'the old blank stop retains a readable feature or has already uncovered the Mac');
    for (let i = 1000; i >= 0; i--) {
      const pose = view.project(i / 1000);
      const content = settingsFeatureEntrancePose(settingsFeatureEntranceTiming.duration * pose.white ** 2);
      assert.ok(Math.max(content.opacity, 1 - pose.white) >= .5,
        'content or the uncovered Mac remains present throughout the handoff');
      if (content.opacity <= .001) assert.ok(pose.white < .15, 'hidden panels cannot leave the Mac covered');
      assert.deepEqual(view.project(i / 1000), pose, 'stopping and reversing retrace exactly the same camera');
    }
  }
});
