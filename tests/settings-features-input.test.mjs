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

test('deliberate strokes recover after quiet without tiny momentum extending the lock', () => {
  const gesture = createSettingsWheelGesture();
  assert.equal(gesture.read(0, 100), 1);
  assert.equal(gesture.read(150, 100), 1);
  for (const [time, delta] of [[170, 60], [190, 30], [210, 10], [230, 2], [250, 1]]) {
    assert.equal(gesture.read(time, delta), 0);
  }
  assert.equal(gesture.read(280, 12), 0, 'one spike is insufficient');
  assert.equal(gesture.read(300, 24), 0);
  assert.equal(gesture.read(320, 3200), 0, 'large distance does not trigger twice');
  assert.equal(gesture.read(599, 120), 1);
  assert.equal(gesture.read(879, 120), 1, 'a pause rearms the next gesture');
  assert.equal(gesture.read(979, 1), 0);
  assert.equal(gesture.read(1019, .5), 0);
  assert.equal(gesture.read(1039, 80), 1, 'tiny tail events do not block new intentional input');
});

test('reversal is immediate and reset forgets outside-section input', () => {
  const gesture = createSettingsWheelGesture();
  assert.equal(gesture.read(0, 100), 1);
  assert.equal(gesture.read(16, -100), -1);
  assert.equal(gesture.read(32, 100), 1);
  gesture.reset();
  assert.equal(gesture.read(40, 100), 1);
});

test('a settled transition accepts renewed input immediately without resetting momentum history', () => {
  const gesture = createSettingsWheelGesture();
  assert.equal(gesture.read(0, 100), 1);
  assert.equal(gesture.read(16, 4), 0);
  assert.equal(gesture.read(32, 40, false), 0, 'input during playback is still consumed');
  assert.equal(gesture.read(48, 3), 0);
  assert.equal(gesture.read(64, 30, true), 1, 'fresh pressure at completion has no cooldown');
  assert.equal(gesture.read(80, 28, true), 0, 'continuing momentum never rearms itself');
});
