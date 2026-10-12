import test from 'node:test';
import assert from 'node:assert/strict';
import { runFeatureDemo } from '../src/home-next/featureDemoMotion.ts';

test('departing demos retain their clock through clipping and reversal, then reset on settlement', () => {
  const events = () => ({ listeners: new Map(),
    addEventListener(key, fn) { this.listeners.set(key, fn); },
    removeEventListener(key) { this.listeners.delete(key); },
    emit(key) { this.listeners.get(key)?.(); } });
  const reduced = { ...events(), matches: false }, desktop = { ...events(), matches: true };
  const document = { ...events(), hidden: false };
  const panel = { dataset: { featureActive: 'true', featureDeparting: 'false' } };
  const root = { dataset: {}, closest: () => panel, removeAttribute() { delete this.dataset.playing; } };
  const frames = new Map();
  let nextId = 0, now = 100, mutation, intersection, resize, disconnected = 0, cleaned = false, measurements = 0;
  const menuBar = {}, observedSizes = [];
  const globals = {
    window: { matchMedia: query => query.includes('reduced') ? reduced : desktop }, document,
    requestAnimationFrame: fn => { frames.set(++nextId, fn); return nextId; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} disconnect() { disconnected++; } },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() { disconnected++; } },
    ResizeObserver: class { constructor(fn) { resize = fn; } observe(target) { observedSizes.push(target); } disconnect() { disconnected++; } },
  };
  const originals = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true });
  let elapsed = 0, stop;
  const step = ms => { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); };
  const visible = value => intersection([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]);
  const state = (active, departing) => { panel.dataset.featureActive = String(active); panel.dataset.featureDeparting = String(departing); mutation(); };
  try {
    stop = runFeatureDemo(root, { measure() { measurements++; }, draw: seconds => { elapsed = seconds; },
      resizeTargets: [menuBar], cleanup() { cleaned = true; } });
    assert.deepEqual(observedSizes, [root, menuBar]);
    visible(true); step(16); step(250);
    assert.equal(elapsed, .6);
    const beforeResize = measurements;
    resize(); assert.equal(measurements, beforeResize + 1);
    assert.equal(elapsed, .6, 'clock width changes remeasure without restarting the demo');
    state(false, true); visible(false); step(250);
    assert.equal(root.dataset.playing, 'true', 'clipping cannot stop a departing demo');
    assert.equal(elapsed, .85);
    // Reversing the handoff returns to the same running demo, without resetting.
    visible(true); state(true, false); step(250);
    assert.equal(elapsed, 1.1);
    state(false, true); visible(false); step(250);
    state(false, false);
    assert.equal(elapsed, .35, 'reset to the cursor entrance only after the destination settles');
    assert.equal(root.dataset.playing, 'false');
    assert.equal(frames.size, 0);
    visible(true); state(true, false); step(16); step(250);
    document.hidden = true; document.emit('visibilitychange'); step(1000);
    assert.equal(elapsed, .6, 'backgrounding still pauses playback');
    document.hidden = false; document.emit('visibilitychange'); step(16); step(250);
    assert.equal(elapsed, .85);
    reduced.matches = true; reduced.emit('change');
    assert.equal(elapsed, 0); assert.equal(root.dataset.playing, 'false');
    stop(); stop = undefined;
    assert.equal(disconnected, 3); assert.equal(cleaned, true); assert.equal(frames.size, 0);
  } finally {
    stop?.();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
