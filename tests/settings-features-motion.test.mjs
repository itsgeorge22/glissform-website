import test from 'node:test';
import assert from 'node:assert/strict';
import { textLinePose } from '../src/home-next/textRevealMotion.ts';
import { settingsFeaturesPose, nextSettingsFeature, settingsFeaturesTiming } from '../src/home-next/settingsFeaturesChoreography.ts';

test('one gesture advances only one feature, regardless of its scroll distance', () => {
  assert.equal(nextSettingsFeature(0, 10000, 4), 1);
  assert.equal(nextSettingsFeature(1, 10000, 4), 2);
  assert.equal(nextSettingsFeature(2, 10000, 4), 3);
  assert.equal(nextSettingsFeature(3, 10000, 4), 3);
  assert.equal(nextSettingsFeature(3, -10000, 4), 2);
  assert.equal(nextSettingsFeature(0, -10000, 4), 0);
});

test('headline and supporting lines share one entrance and exit clock', () => {
  assert.equal(settingsFeaturesTiming.enterCopy.duration, 700);
  assert.equal(settingsFeaturesTiming.exitCopy.duration, settingsFeaturesTiming.enterCopy.duration);
});

test('copy exits with the panel and hands off immediately without overlap', () => {
  assert.equal(settingsFeaturesTiming.exitCopy.start, settingsFeaturesTiming.panel.start);
  assert.equal(settingsFeaturesTiming.enterCopy.start,
    settingsFeaturesTiming.exitCopy.start + settingsFeaturesTiming.exitCopy.duration);
  assert.equal(settingsFeaturesTiming.panel.duration, 1150);
  for (let elapsed = 0; elapsed <= settingsFeaturesTiming.duration; elapsed++) {
    const pose = settingsFeaturesPose(elapsed);
    const outgoing = [0, 1, 2].some(line => textLinePose(pose.exitCopy, line, 3).opacity > 0);
    const incoming = [0, 1, 2].some(line => textLinePose(pose.enterCopy, line, 3).opacity > 0);
    assert.ok(!(outgoing && incoming), `copies overlap at ${elapsed}ms`);
    if (elapsed !== settingsFeaturesTiming.enterCopy.start) assert.ok(outgoing || incoming,
      `unexpected empty hold at ${elapsed}ms`);
  }
});

test('the panel keeps progressing with a 24px gap and visible neighboring edge', () => {
  let previous = 0;
  for (let elapsed = 0; elapsed <= settingsFeaturesTiming.duration; elapsed++) {
    const pose = settingsFeaturesPose(elapsed);
    assert.ok(pose.panel >= previous);
    previous = pose.panel;
    for (const height of [600, 900, 1080]) {
      const panelHeight = height - 128, distance = panelHeight + 24;
      const outgoingBottom = 64 - pose.panel * distance + panelHeight;
      const incomingTop = 64 + (1 - pose.panel) * distance;
      assert.ok(Math.abs(incomingTop - outgoingBottom - 24) < 1e-8);
      if (pose.panel === 1) assert.equal(outgoingBottom, 40, 'previous panel remains visible above the 24px gap');
    }
  }
  assert.deepEqual(settingsFeaturesPose(settingsFeaturesTiming.duration), {
    exitCopy: 0, panel: 1, enterCopy: 1,
  });
});

test('headline and subtitle reverse the same line sequence in either direction', () => {
  const { exitCopy, enterCopy } = settingsFeaturesTiming;
  for (let time = 0; time <= exitCopy.duration; time += 7) {
    const exit = settingsFeaturesPose(time);
    const entrance = settingsFeaturesPose(enterCopy.start + exitCopy.duration - time);
    for (const direction of [1, -1]) for (const line of [0, 1, 2]) {
      const actual = textLinePose(exit.exitCopy, line, 3, direction);
      const expected = textLinePose(entrance.enterCopy, line, 3, direction);
      for (const key of Object.keys(expected)) assert.ok(Math.abs(actual[key] - expected[key]) < 1e-10,
        `line ${line}: ${key} must retrace the shared entrance`);
    }
  }
});
