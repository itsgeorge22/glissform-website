import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsWheelGesture } from '../src/home-next/settingsFeaturesInput.ts';

test('dense and sparse momentum tails each remain one gesture', () => {
  for (const interval of [16, 40, 100, 200]) {
    const gesture = createSettingsWheelGesture();
    assert.equal(gesture.read(0, 120), 1);
    for (let i = 1; i < 50; i++) {
      const delta = interval === 200 ? 1 : 120 * Math.pow(.94, i);
      assert.equal(gesture.read(i * interval, delta), 0);
    }
  }
});

test('short separate strokes and renewed pressure are recognized', () => {
  const gesture = createSettingsWheelGesture();
  assert.equal(gesture.read(0, 100), 1);
  assert.equal(gesture.read(150, 100), 1);
  for (const [time, delta] of [[170, 60], [190, 30], [210, 10], [230, 2], [250, 1]]) {
    assert.equal(gesture.read(time, delta), 0);
  }
  assert.equal(gesture.read(280, 12), 0, 'one spike is insufficient');
  assert.equal(gesture.read(300, 24), 1);
  assert.equal(gesture.read(320, 32), 0, 'continued acceleration does not trigger twice');
});

test('reversal is immediate and reset forgets outside-section input', () => {
  const gesture = createSettingsWheelGesture();
  assert.equal(gesture.read(0, 100), 1);
  assert.equal(gesture.read(16, -100), -1);
  assert.equal(gesture.read(32, 100), 1);
  gesture.reset();
  assert.equal(gesture.read(40, 100), 1);
});
