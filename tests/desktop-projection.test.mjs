import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopProjection, desktopShading } from '../src/desktopProjection.ts';

// Trace from the native app's seated eye through the folding screen back to
// its original screenshot plane, independently of the GPU implementation.
function sourcePoint(degrees, x, y) {
  const projection = desktopProjection(degrees);
  const height = 1 - y;
  const width = 1 - height * (1 - projection.topWidth);
  const geometricWidth = 1 - height * projection.sine / 4;
  const surface = [
    (x - .5) * geometricWidth / width,
    height * projection.cosine,
    height * projection.sine,
  ];
  const eye = [0, 1.1, 4];
  const ray = surface.map((value, index) => value - eye[index]);
  const travel = -eye[2] / ray[2];
  return [eye[0] + ray[0] * travel + .5, 1 - (eye[1] + ray[1] * travel)];
}

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);

test('the connected screen restores asymmetric source points without flipping or moving them', () => {
  for (const [x, y] of [[0, 0], [.93, .03], [.17, .81], [.97, .95], [1, 1]]) {
    const [u, v] = sourcePoint(0, x, y);
    close(u, x); close(v, y);
  }
});

test('the entire bottom edge stays seated throughout the supported fold range', () => {
  for (let degrees = 0; degrees <= 130; degrees++) {
    for (const x of [0, .13, .5, .82, 1]) {
      const [u, v] = sourcePoint(degrees, x, 1);
      close(u, x); close(v, 1);
    }
  }
});

test('folding narrows the top while wallpaper covers its center without a horizontal black band', () => {
  let previousWidth = 1;
  let previousSample = 0;
  for (let degrees = 1; degrees <= 130; degrees++) {
    const { topWidth } = desktopProjection(degrees);
    const inset = (1 - topWidth) / 2;
    const [center, sample] = sourcePoint(degrees, .5, 0);
    assert.ok(topWidth > 0 && topWidth < previousWidth);
    close(center, .5);
    assert.ok(sample > previousSample && sample < .57, 'screen top must sample inside the original wallpaper');
    close(sourcePoint(degrees, inset, 0)[0], 0);
    close(sourcePoint(degrees, 1 - inset, 0)[0], 1);
    previousWidth = topWidth;
    previousSample = sample;
  }
});

test('source orientation remains upright and left-to-right at every screen height', () => {
  for (const degrees of [18, 32, 64, 90, 130]) {
    let previousY = -1;
    for (const y of [0, .13, .51, .86, 1]) {
      const left = sourcePoint(degrees, .3, y);
      const right = sourcePoint(degrees, .7, y);
      assert.ok(left[0] < .5 && right[0] > .5);
      close(left[0] + right[0], 1);
      assert.ok(left[1] > previousY);
      previousY = left[1];
    }
  }
});

test('frost and shadows disappear at contact and stay finite throughout the supported range', () => {
  const connected = desktopShading(0, 600);
  close(connected.frost, 0);
  close(connected.broadShadow, 0);
  close(connected.contactShadow, 0);
  for (let degrees = 0; degrees <= 130; degrees++) {
    const surface = desktopShading(degrees, 600);
    assert.ok(Object.values(surface).every(value => Number.isFinite(value) && value >= 0));
    assert.ok(surface.contactWidth > 0);
    assert.ok(surface.contactShadow <= 1 && surface.broadShadow <= 1);
  }
});
