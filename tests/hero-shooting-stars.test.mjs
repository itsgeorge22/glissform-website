import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createShootingStar, connectShootingStars } from '../src/hero-test/shootingStars.ts';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('whole flights stay in the top 70% and avoid the entire offer and navbar', () => {
  for (const [width, height, offerTop] of [[1124, 688, 140], [1408, 868, 150], [1888, 1048, 240], [2528, 1408, 240]]) {
    const regions = [
      { left: width / 2 - 372, top: offerTop, right: width / 2 + 372, bottom: offerTop + 388 },
      { left: width / 2 - 237, top: height - 84, right: width / 2 + 237, bottom: height - 20 },
    ];
    let visibleFlights = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const star = createShootingStar(width, height, regions, seededRandom(seed));
      if (!star) continue;
      visibleFlights++;
      assert.ok(star.size >= 4.8 && star.size <= 5.6);
      assert.ok(star.tail >= 42 && star.tail <= 56);
      assert.ok(star.duration >= 1100 && star.duration <= 1400);
      const angle = star.angle * Math.PI / 180;
      const startX = star.x - Math.cos(angle) * star.tail;
      const startY = star.y - Math.sin(angle) * star.tail;
      for (let step = 0; step <= 40; step++) {
        const x = startX + (star.x + star.dx - startX) * step / 40;
        const y = startY + (star.y + star.dy - startY) * step / 40;
        assert.ok(x >= 27.99 && x <= width - 27.99 && y >= 79.99 && y <= height * .7 - 31.99);
        assert.ok(regions.every(rect => x <= rect.left - 32 || x >= rect.right + 32 || y <= rect.top - 32 || y >= rect.bottom + 32));
      }
    }
    assert.ok(visibleFlights >= 95, `${width}px should have enough clear flight paths`);
  }
});

test('a blocked or undersized field skips the streak instead of covering content', () => {
  assert.equal(createShootingStar(0, 0, []), null);
  assert.equal(createShootingStar(1408, 868, [{ left: 0, top: 0, right: 1408, bottom: 868 }]), null);
});

function mountShootingStars(reduced = false) {
  const previous = { window: globalThis.window, document: globalThis.document, IntersectionObserver: globalThis.IntersectionObserver };
  const timers = new Map();
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const values = new Map();
  let intersect;
  let nextTimer = 0;
  let disconnected = false;
  const surface = { querySelectorAll: () => [] };
  const field = { getBoundingClientRect: () => ({ left: 16, top: 16, width: 1408, height: 868 }) };
  const star = Object.assign(new EventTarget(), { dataset: {}, style: { setProperty: (name, value) => values.set(name, value) } });
  globalThis.document = Object.assign(new EventTarget(), { hidden: false });
  globalThis.window = Object.assign(new EventTarget(), {
    matchMedia: () => motion,
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  globalThis.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  const cleanup = connectShootingStars(surface, field, star);
  return {
    timers, motion, star, values, cleanup,
    visible: value => intersect([{ isIntersecting: value }]),
    fire() { const [id, timer] = [...timers][0]; timers.delete(id); timer.callback(); },
    end(name = 'hero-shooting-star') { star.dispatchEvent(Object.assign(new Event('animationend'), { animationName: name })); },
    disconnected: () => disconnected,
    restore() { cleanup(); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } },
  };
}

test('one brief shooting star follows a quiet opening and a long varied gap', () => {
  const field = mountShootingStars();
  try {
    assert.equal(field.timers.size, 0);
    field.visible(true);
    const first = [...field.timers.values()][0].delay;
    assert.ok(first >= 8000 && first <= 12000);
    field.fire();
    assert.equal(field.star.dataset.shooting, 'true');
    assert.equal(field.timers.size, 0);
    for (const animation of ['download-spark', 'hero-shooting-tail', 'hero-shooting-core']) {
      field.end(animation);
      assert.equal(field.star.dataset.shooting, 'true');
      assert.equal(field.timers.size, 0);
    }
    field.end();
    assert.equal(field.star.dataset.shooting, undefined);
    assert.equal(field.timers.size, 1);
    const next = [...field.timers.values()][0].delay;
    assert.ok(next >= 16000 && next <= 26000);
    field.visible(true);
    assert.equal(field.timers.size, 1);
  } finally { field.restore(); }
});

test('hidden, offscreen, reduced-motion and resized views cancel rather than queue up streaks', () => {
  const field = mountShootingStars(true);
  try {
    field.visible(true);
    assert.equal(field.timers.size, 0);
    field.motion.matches = false;
    field.motion.dispatchEvent(new Event('change'));
    for (const [disable, enable] of [
      [() => { document.hidden = true; document.dispatchEvent(new Event('visibilitychange')); }, () => { document.hidden = false; document.dispatchEvent(new Event('visibilitychange')); }],
      [() => field.visible(false), () => field.visible(true)],
      [() => { field.motion.matches = true; field.motion.dispatchEvent(new Event('change')); }, () => { field.motion.matches = false; field.motion.dispatchEvent(new Event('change')); }],
    ]) {
      field.fire();
      disable();
      assert.equal(field.star.dataset.shooting, undefined);
      assert.equal(field.timers.size, 0);
      enable();
      assert.equal(field.timers.size, 1);
    }
    field.fire();
    window.dispatchEvent(new Event('resize'));
    assert.equal(field.star.dataset.shooting, undefined);
    assert.equal(field.timers.size, 1);
    field.cleanup();
    assert.equal(field.timers.size, 0);
    assert.equal(field.disconnected(), true);
    field.end();
    window.dispatchEvent(new Event('resize'));
    assert.equal(field.timers.size, 0);
  } finally { field.restore(); }
});
