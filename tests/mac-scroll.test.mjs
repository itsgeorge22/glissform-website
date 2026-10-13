import test from 'node:test';
import assert from 'node:assert/strict';
import { createMacScrollLimiter, createMacScrollHandoff, controlMacScroll, macScrollTiming } from '../src/home-next/macScroll.ts';

test('slow input preserves every pixel and stops without a smoothing tail', () => {
  const input = createMacScrollLimiter();
  for (const delta of [.125, 1, 4, 12, -1, -.25, -8]) {
    input.add(delta);
    assert.equal(input.step(16), delta);
    assert.equal(input.pending, 0);
    assert.equal(input.step(16), 0);
  }
});

test('the cap is measured per second at 60Hz, 120Hz and 240Hz', () => {
  for (const hz of [60, 120, 240]) {
    const input = createMacScrollLimiter();
    let distance = 0;
    for (let frame = 0; frame < hz; frame++) {
      input.add(10000);
      const delta = input.step(1000 / hz);
      assert.ok(delta <= macScrollTiming.maxSpeed / hz + 1e-9);
      distance += delta;
    }
    assert.ok(Math.abs(distance - macScrollTiming.maxSpeed) < 1e-8);
  }
});

test('flick backlog stays short, opposite input reverses on the very next frame', () => {
  const input = createMacScrollLimiter();
  for (let i = 0; i < 500; i++) input.add(10000);
  assert.equal(input.pending, macScrollTiming.maxSpeed * macScrollTiming.maxPendingMs / 1000);
  assert.ok(input.step(16) > 0);
  input.add(-2);
  assert.equal(input.step(16), -2, 'no remaining forward drift before the reversal');
  assert.equal(input.pending, 0);
  input.add(-10000);
  input.add(1);
  assert.equal(input.step(16), 1);
  input.add(10000);
  for (let elapsed = 0; elapsed < macScrollTiming.maxPendingMs; elapsed += 16) input.step(16);
  assert.ok(Math.abs(input.pending) < 1e-9);
  input.reset();
  input.add(Number.NaN);
  input.add(Infinity);
  assert.equal(input.step(16), 0);
});

test('a stalled frame cannot consume a long native scroll jump', () => {
  const input = createMacScrollLimiter();
  input.add(100000);
  assert.equal(input.step(5000), macScrollTiming.maxSpeed * macScrollTiming.maxFrameMs / 1000);
  input.reset();
  assert.equal(input.step(16), 0);
});

test('automatic handoffs inherit speed in both directions and settle without overshoot', () => {
  for (const direction of [-1, 1]) for (const distance of [.5, 24, 280, 1000, 1120, 4000]) {
    for (const speed of [0, 60, 400, 1000, 1600, 10000]) {
      const from = 2000, to = from + direction * distance;
      const motion = createMacScrollHandoff(from, to, direction * speed);
      const epsilon = motion.duration * 1e-6;
      const initialSpeed = direction * (motion.position(epsilon) - from) * 1000 / epsilon;
      assert.ok(Math.abs(initialSpeed - Math.min(speed, macScrollTiming.maxSpeed)) < .02,
        'the first automatic movement has the incoming velocity, including near the endpoint');
      assert.equal(motion.position(0), from);
      assert.equal(motion.position(motion.duration), to);
      assert.equal(motion.position(motion.duration + 1000), to);
      const endSpeed = direction * (to - motion.position(motion.duration - epsilon)) * 1000 / epsilon;
      assert.ok(endSpeed >= -.01 && endSpeed < .02, 'arrive at rest');
      for (const hz of [60, 120, 240]) {
        let previous = from, previousTime = 0;
        for (let time = 1000 / hz; previousTime < motion.duration; time += 1000 / hz) {
          const elapsed = Math.min(time, motion.duration), position = motion.position(elapsed);
          const delta = direction * (position - previous);
          assert.ok(delta >= -1e-8, 'never reverse or overshoot during completion');
          assert.ok(delta <= macScrollTiming.maxSpeed * (elapsed - previousTime) / 1000 + 1e-8,
            'automatic motion respects the same speed cap at every frame rate');
          previous = position; previousTime = elapsed;
        }
      }
    }
  }
  assert.equal(createMacScrollHandoff(10, 10, 1600).position(0), 10);
  assert.equal(createMacScrollHandoff(0, 100, -1600).position(10), createMacScrollHandoff(0, 100, 0).position(10),
    'stale velocity in the opposite direction cannot pull the handoff backward');
});

class Events {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, options = {}) {
    const event = { target: new Element(), deltaX: 0, deltaY: 0, deltaMode: 0, cancelable: true,
      defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...options };
    for (const callback of this.listeners.get(type) ?? []) callback(event);
    return event;
  }
  get size() { return [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0); }
}
class Element { closest() { return null; } }

test('the page shares limited movement, releases boundaries and cleans up interruptions', () => {
  let now = 0, id = 0, enabled = true;
  const frames = new Map(), window = new Events(), document = new Events(), drawn = [];
  window.scrollY = 100; window.innerHeight = 720; document.hidden = false;
  window.scrollTo = ({ top, behavior }) => {
    assert.equal(behavior, 'instant');
    window.scrollY = Math.round(top);
  };
  const globals = { window, document, HTMLElement: Element, performance: { now: () => now },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: frame => frames.delete(frame) };
  const original = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true });
  const step = ms => {
    now += ms;
    const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now));
    // Browsers deliver scroll events after scrollTo has returned.
    window.emit('scroll');
  };
  const wheel = (deltaY, extra = {}) => window.emit('wheel', { deltaY, ...extra });
  let controller;
  try {
    controller = controlMacScroll(() => ({ start: 0, end: 1000, enabled }), () => drawn.push(window.scrollY));
    assert.equal(wheel(8).defaultPrevented, true);
    step(16); assert.equal(window.scrollY, 108); assert.equal(drawn.at(-1), 108);
    // Fractional deltas survive browser pixel rounding across separate gestures.
    for (let i = 0; i < 4; i++) { wheel(.25); step(16); }
    assert.equal(window.scrollY, 109);
    wheel(10000); step(16);
    const beforeReverse = window.scrollY;
    wheel(-4); step(16);
    assert.equal(window.scrollY, beforeReverse - 4);
    step(1000); assert.equal(frames.size, 0);
    for (const extra of [{ ctrlKey: true }, { deltaX: 1000 }, { defaultPrevented: true }, { cancelable: false }]) {
      const event = wheel(10, extra);
      assert.equal(event.defaultPrevented, extra.defaultPrevented ?? false);
      assert.equal(frames.size, 0);
    }
    const input = new Element(); input.closest = () => input;
    assert.equal(wheel(10, { target: input }).defaultPrevented, false);
    window.scrollY = 990; window.emit('scroll');
    wheel(10000); step(16);
    assert.equal(window.scrollY, 1000); assert.equal(frames.size, 0);
    assert.equal(wheel(100).defaultPrevented, false, 'forward boundary returns to the feature controller');
    assert.equal(wheel(-2).defaultPrevented, true); step(16); assert.equal(window.scrollY, 998);
    window.scrollY = 0; window.emit('scroll');
    assert.equal(wheel(-100).defaultPrevented, false);
    wheel(1); step(0);
    assert.equal(window.scrollY, 0);
    assert.equal(frames.size, 1, 'a same-frame timestamp cannot discard inward movement at the opening boundary');
    step(16); assert.equal(window.scrollY, 1);
    window.scrollY = 0; window.emit('scroll');
    assert.equal(wheel(1, { deltaMode: 1 }).defaultPrevented, true); step(16); assert.equal(window.scrollY, 16);
    wheel(1, { deltaMode: 2 }); step(16);
    assert.ok(window.scrollY <= 42, 'page-mode input obeys the same maximum speed');
    for (const event of ['keydown', 'pointerdown', 'resize', 'pagehide', 'pageshow']) {
      wheel(10000); const before = window.scrollY;
      window.emit(event); step(100);
      assert.equal(window.scrollY, before); assert.equal(frames.size, 0);
    }
    wheel(10000); window.scrollY = 600; window.emit('scroll'); step(100);
    assert.equal(window.scrollY, 600, 'native navigation cannot inherit a queued flick');
    wheel(10000); document.hidden = true; document.emit('visibilitychange'); step(100);
    assert.equal(window.scrollY, 600); assert.equal(frames.size, 0);
    document.hidden = false;
    wheel(10000); enabled = false; step(16);
    assert.equal(window.scrollY, 600); assert.equal(wheel(100).defaultPrevented, false);
    enabled = true;
    controller.dispose();
    window.scrollY = 1000;
    controller = controlMacScroll(() => ({ start: 0, end: 1000, enabled, returnDistance: 280, forwardStart: 750 }), () => drawn.push(window.scrollY));
    assert.equal(wheel(-1).defaultPrevented, true);
    step(16); const exitStart = window.scrollY;
    for (let i = 0; i < 80; i++) step(16);
    assert.ok(exitStart <= 1000);
    assert.equal(window.scrollY, 720, 'one upward gesture completes the return without more input');
    assert.equal(frames.size, 0);
    window.scrollY = 1000; window.emit('scroll'); wheel(-1); step(100);
    const reversingAt = window.scrollY;
    wheel(2); step(16);
    assert.equal(window.scrollY, Math.min(1000, reversingAt + 2), 'opposite input immediately cancels the automatic return');
    window.scrollY = 1000; window.emit('scroll');
    assert.equal(window.emit('keydown', { key: 'ArrowUp' }).defaultPrevented, true);
    step(32); const pausedAt = window.scrollY;
    window.emit('pagehide'); step(100);
    assert.equal(window.scrollY, pausedAt, 'lifecycle changes cancel the automatic return');
    window.scrollY = 740; window.emit('scroll');
    wheel(16); step(16);
    const manualArrival = window.scrollY;
    step(16);
    assert.ok(window.scrollY - manualArrival >= 14 && window.scrollY - manualArrival <= 17,
      'the first automatic frame continues manual speed instead of restarting from rest');
    for (let i = 0; i < 80; i++) step(16);
    assert.equal(window.scrollY, 1000, 'crossing the white reveal finishes forward without further scrolling');
    assert.equal(frames.size, 0);
    window.scrollY = 740; window.emit('scroll'); wheel(16); step(16); step(32);
    const forwardAt = window.scrollY;
    wheel(-2); step(16);
    assert.equal(window.scrollY, forwardAt - 2, 'upward input immediately interrupts forward completion');
    for (let i = 0; i < 80; i++) step(16);
    assert.equal(window.scrollY, forwardAt - 2, 'stopping after reversal does not restart automatic forward motion');
    window.scrollY = 740; window.emit('scroll');
    window.scrollY = 760; window.emit('scroll');
    for (let i = 0; i < 80; i++) step(16);
    assert.equal(window.scrollY, 1000, 'native forward scrolling across the reveal also completes');
    wheel(-16); step(16);
    const reverseArrival = window.scrollY;
    step(16);
    assert.ok(reverseArrival - window.scrollY >= 14 && reverseArrival - window.scrollY <= 17,
      'the automatic return inherits the first accepted upward movement');
    const beforeSecondReversal = window.scrollY;
    wheel(2); step(16);
    assert.equal(window.scrollY, beforeSecondReversal + 2, 'reversal immediately replaces inherited reverse speed');
    window.scrollY = 600; window.emit('scroll');
    enabled = true; wheel(10000); controller.dispose(); controller = undefined; step(100);
    assert.equal(window.scrollY, 600);
    assert.equal(window.size + document.size + frames.size, 0);
  } finally {
    controller?.dispose();
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
