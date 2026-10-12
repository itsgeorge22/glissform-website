import test from 'node:test';
import assert from 'node:assert/strict';
import { stayUpdatedPose, stayUpdatedTiming as timing } from '../src/home-next/stayUpdatedMotion.ts';
import { featureDemoPause } from '../src/home-next/featureDemoMotion.ts';
import { updateLoaderPath, updateCheckRoute } from '../src/home-next/stayUpdatedIcon.ts';
import { updateConfetti, updateConfettiDuration, updateConfettiPose } from '../src/home-next/stayUpdatedConfetti.ts';

const start = timing.release + timing.change;
const complete = start + timing.progress;
const confettiEnd = complete + updateConfettiDuration;
const fold = confettiEnd - timing.fold - timing.reopen;
const reset = fold + timing.fold;

test('the check stroke travels clockwise around the loader and exits without reversing its tangent', () => {
  const route = updateCheckRoute(stayUpdatedPose(complete).spinnerAngle);
  const coordinates = route.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
  let from = coordinates.slice(0, 2);
  for (let segment = 0; segment < 5; segment++) {
    const control = coordinates.slice(2 + segment * 6, 4 + segment * 6);
    const tangent = [control[0] - from[0], control[1] - from[1]];
    // Positive angular travel is clockwise in SVG's downward-positive Y axis.
    assert.ok((from[0] - 19.2771) * tangent[1] - (from[1] - 19.2771) * tangent[0] > 0);
    from = coordinates.slice(6 + segment * 6, 8 + segment * 6);
  }
  const incoming = [from[0] - coordinates[28], from[1] - coordinates[29]];
  const outgoing = [coordinates[32] - from[0], coordinates[33] - from[1]];
  assert.ok(incoming[0] * outgoing[0] + incoming[1] * outgoing[1] > 0);
  const angle = stayUpdatedPose(complete).spinnerAngle * Math.PI / 180;
  for (const [index, expected] of [[36, [30, 10.5]], [38, [16, 27]], [40, [8.5, 19.5]]]) {
    const x = coordinates[index] - 19.2771, y = coordinates[index + 1] - 19.2771;
    const world = [19.2771 + x * Math.cos(angle) - y * Math.sin(angle),
      19.2771 + x * Math.sin(angle) + y * Math.cos(angle)];
    assert.ok(world.every((value, axis) => Math.abs(value - expected[axis]) < .001),
      'enter the upper-right tip, pass through the corner, and finish at the left tip');
  }
});

test('the five-second fill accelerates continuously while the remaining time counts down', () => {
  const amounts = Array.from({ length: 6 }, (_, second) => stayUpdatedPose(start + second));
  assert.deepEqual(amounts.map(p => p.secondsLeft), [5, 4, 3, 2, 1, 0]);
  assert.equal(amounts[0].progress, 0);
  assert.equal(amounts.at(-1).progress, 1);
  const steps = amounts.slice(1).map((p, i) => p.progress - amounts[i].progress);
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i] > steps[i - 1]);
  for (let t = start; t < complete; t += .017) {
    const pose = stayUpdatedPose(t);
    assert.ok(pose.progress >= 0 && pose.progress < 1);
    assert.equal(pose.stage, 'updating');
    assert.ok(pose.label <= 1, 'Done cannot arrive before completion');
  }
});

test('Done and the celebration start together; fold and reopen during the last 800ms of confetti, then pause two seconds', () => {
  const before = stayUpdatedPose(complete - .001), after = stayUpdatedPose(complete + .001);
  assert.equal(before.cardScale, 1); assert.equal(before.label, 1);
  assert.ok(after.cardScale > 1); assert.ok(after.label > 1); assert.equal(after.progress, 1);
  assert.ok(Math.abs(stayUpdatedPose(complete + timing.change).label - 2) < 1e-9);
  const held = stayUpdatedPose(complete + timing.takeoff + timing.landing + .1);
  assert.equal(held.stage, 'done'); assert.equal(held.progress, 1); assert.equal(held.label, 2);
  assert.equal(held.cardScale, 1);
  for (let age = 0; age < updateConfettiDuration; age += .013) {
    if (updateConfetti.some(piece => updateConfettiPose(piece, age, 205).opacity > 0)) {
      assert.ok(stayUpdatedPose(complete + age).confettiTime >= 0, 'confetti continues through the hidden state reset');
    }
  }
  const landing = stayUpdatedPose(reset - .0001), original = stayUpdatedPose(reset);
  assert.ok(Math.abs(landing.cardScale - 1) < .00001);
  assert.ok(Math.abs(landing.cardY) < .00001);
  assert.equal(landing.label, 2); assert.equal(landing.progress, 1);
  assert.equal(original.fold, 0, 'restore the original only while fully hidden');
  assert.equal(original.label, 0); assert.equal(original.progress, 0);
  assert.equal(original.morph, 0); assert.equal(original.arrowY, 0);
  assert.equal(original.cardScale, 1); assert.ok(original.cardY === 0);
  assert.equal(timing.fold, .4); assert.equal(timing.reopen, .4);
  assert.ok(Math.abs(confettiEnd - fold - .8) < 1e-9);
  assert.ok(fold > complete + timing.takeoff + timing.landing);
  assert.equal(stayUpdatedPose(confettiEnd).confettiTime, -1);
  assert.equal(stayUpdatedPose(fold).fold, 1);
  let previousHeight = 1, maxHeight = 0;
  for (let t = fold; t < reset; t += .001) {
    const pose = stayUpdatedPose(t);
    assert.ok(pose.fold <= previousHeight && pose.fold >= 0);
    assert.equal(pose.label, 2); assert.ok(pose.confettiTime >= 0);
    previousHeight = pose.fold;
  }
  for (let t = reset; t < reset + timing.reopen; t += .001) {
    const pose = stayUpdatedPose(t);
    assert.equal(pose.label, 0); assert.equal(pose.cursorVisible, false);
    assert.ok(pose.confettiTime >= 0);
    maxHeight = Math.max(maxHeight, pose.fold);
  }
  assert.ok(maxHeight > 1.019 && maxHeight < 1.021);
  assert.equal(stayUpdatedPose(reset + timing.reopen).fold, 1);
  assert.equal(stayUpdatedPose(confettiEnd + featureDemoPause - .001).cursorVisible, false);
  assert.equal(stayUpdatedPose(confettiEnd + featureDemoPause + .001).cursorVisible, true);
});

test('the arrow anticipates and compresses into the shelf, then the curled loader recoils and launches clockwise', () => {
  const diveAt = timing.release + timing.arrowPull;
  const curlAt = diveAt + timing.arrowDive * .65;
  const spinAt = curlAt + timing.loaderRecoil;
  const pulled = stayUpdatedPose(diveAt);
  assert.ok(pulled.arrowY < -3); assert.equal(pulled.arrowScaleY, 1);
  assert.equal(pulled.morph, 0); assert.equal(pulled.spinnerAngle, 0);
  const diving = stayUpdatedPose(diveAt + timing.arrowDive * .8);
  assert.ok(diving.arrowY > 0); assert.ok(diving.arrowScaleY < .8);
  const recoiled = stayUpdatedPose(spinAt);
  assert.ok(recoiled.spinnerAngle < -20);
  assert.ok(recoiled.morph > 0 && recoiled.morph < 1);
  assert.ok(stayUpdatedPose(spinAt + .3).spinnerAngle > 0);
  assert.ok(stayUpdatedPose(timing.release + 1).loaderWidth > 4.2);
  for (let t = timing.release; t <= timing.release + 1; t += .01) {
    const path = updateLoaderPath(stayUpdatedPose(t).morph);
    assert.ok(!/NaN|Infinity|undefined/.test(path));
    assert.equal((path.match(/C/g) || []).length, 5);
  }
  assert.notEqual(updateLoaderPath(0), updateLoaderPath(1));
  for (const t of [0, 3, 5, complete, reset, 100]) {
    const pose = stayUpdatedPose(t, true);
    assert.equal(pose.cursorVisible, false); assert.equal(pose.progress, 0);
    assert.equal(pose.label, 0); assert.equal(pose.arrowY, 0); assert.equal(pose.morph, 0);
    assert.equal(pose.arrowScaleY, 1); assert.equal(pose.spinnerAngle, 0);
    assert.equal(pose.check, 0);
    assert.equal(pose.cardScale, 1); assert.ok(pose.cardY === 0);
    assert.equal(pose.confettiTime, -1); assert.equal(pose.fold, 1);
  }
});

test('one confetti launch spreads beyond the card and preserves varied fade heights even in short panels', () => {
  const fadeHeights = new Set();
  const apexXs = [], shortFadeHeights = [];
  assert.equal(updateConfetti.length, 44);
  for (const piece of updateConfetti) {
    const before = updateConfettiPose(piece, 0, 205);
    assert.equal(before.opacity, 0);
    const rising = updateConfettiPose(piece, piece.delay + piece.rise / 2, 205);
    assert.equal(rising.front, false);
    const origin = updateConfettiPose(piece, piece.delay, 205);
    assert.ok(origin.x === 0); assert.equal(origin.y, 123); assert.equal(origin.front, false);
    const apex = updateConfettiPose(piece, piece.delay + piece.rise + .001, 205);
    assert.equal(apex.front, true); assert.ok(apex.y < -100);
    apexXs.push(apex.x);
    const final = updateConfettiPose(piece, piece.delay + piece.rise + piece.fall + .001, 205);
    assert.ok(final.y > 205); assert.equal(final.opacity, 0);
    fadeHeights.add(Math.round(final.y));
    const shortFinal = updateConfettiPose(piece, piece.delay + piece.rise + piece.fall + .001, 205, 150);
    assert.ok(shortFinal.y <= 355); assert.equal(shortFinal.opacity, 0);
    shortFadeHeights.push(shortFinal.y);
    assert.equal(updateConfettiPose(piece, updateConfettiDuration + .001, 205).opacity, 0);
  }
  assert.ok(fadeHeights.size > 20, 'pieces do not disappear on one horizontal cutoff');
  assert.ok(Math.max(...apexXs) - Math.min(...apexXs) > 400, 'the single fan extends beyond both card edges');
  assert.ok(Math.max(...fadeHeights) - Math.min(...fadeHeights) > 180);
  assert.ok(Math.max(...shortFadeHeights) - Math.min(...shortFadeHeights) > 100);
});
