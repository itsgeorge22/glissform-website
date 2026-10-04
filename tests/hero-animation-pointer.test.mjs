import test from 'node:test';
import assert from 'node:assert/strict';
import { unprojectPlanePoint } from '../src/hero-test-animation/projectedPointer.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} differs from ${expected}`);
const project = (matrix, x, y) => ({
  x: (matrix[0] * x + matrix[1] * y + matrix[2]) / (matrix[6] * x + matrix[7] * y + 1),
  y: (matrix[3] * x + matrix[4] * y + matrix[5]) / (matrix[6] * x + matrix[7] * y + 1),
});

test('pointer coordinates survive scale, rotation and nested perspective without changing the local point', () => {
  const poses = [
    [1488, 0, 16, 0, 868, 16, 0, 0],
    [550, -50, 470, 120, 230, 190, .12, -.3],
    [300, -120, 180, -110, 125, 420, -.2, .22],
    [-510, 70, 990, 100, 270, 90, .4, -.1],
  ];
  for (const matrix of poses) {
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => project(matrix, x, y));
    for (const [x, y] of [[0, 0], [1, 1], [.1, .83], [.65, .19], [.5, .5], [-.008, .4]]) {
      const point = unprojectPlanePoint(project(matrix, x, y), corners, 1488, 868);
      assert.ok(point);
      close(point.x, x * 1488); close(point.y, y * 868);
    }
  }
});

test('degenerate, crossed and nonfinite screen planes reject input', () => {
  const cases = [
    [{ x: 10, y: 20 }, { x: 10, y: 20 }, { x: 10, y: 20 }, { x: 10, y: 20 }],
    [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: .001 }, { x: 0, y: .001 }],
    [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 100, y: 0 }, { x: 0, y: 100 }],
    [{ x: NaN, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
  ];
  for (const corners of cases) assert.equal(unprojectPlanePoint({ x: 50, y: 50 }, corners, 100, 100), null);
  const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  assert.equal(unprojectPlanePoint({ x: Infinity, y: 0 }, square, 100, 100), null);
  assert.equal(unprojectPlanePoint({ x: 50, y: 50 }, square, 0, 100), null);
});
