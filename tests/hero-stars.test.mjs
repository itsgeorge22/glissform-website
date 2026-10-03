import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHeroStars } from '../src/hero-test/heroStarLayout.ts';
import { starRipple } from '../src/hero-test/starRipple.ts';
import { connectStarField } from '../src/starFieldInteraction.ts';

test('larger desktop screens add stars without enlarging them or exceeding the budget', () => {
  const laptop = createHeroStars(1408, 868, []);
  const desktop = createHeroStars(1888, 1048, []);
  const wide = createHeroStars(3808, 2128, []);
  assert.ok(desktop.length > laptop.length);
  assert.ok(wide.length > desktop.length && wide.length <= 120);
  for (const [width, height, stars] of [[1408, 868, laptop], [1888, 1048, desktop], [3808, 2128, wide]]) {
    assert.ok(stars.every(star => star.x >= 28 && star.x <= width - 28 && star.y >= 76 && star.y <= height - 36));
    assert.ok(stars.every(star => star.size <= 3.1 && star.duration >= 8));
    assert.ok(stars.some(star => star.x < width / 4) && stars.some(star => star.x > width * .75));
  }
  assert.deepEqual(createHeroStars(1408, 868, []), laptop);
});

test('only the main offer has a soft clearing; lower stars keep their brightness', () => {
  const regions = [
    { left: 332, top: 150, right: 1076, bottom: 540 },
  ];
  const stars = createHeroStars(1408, 868, regions);
  const unmasked = createHeroStars(1408, 868, []);
  const nearNavbar = stars.filter(star => star.y >= 752 && star.x >= 436 && star.x <= 972);
  assert.ok(nearNavbar.length > 0);
  assert.ok(nearNavbar.every(star => star.opacity === unmasked[star.id].opacity));
  const clearance = star => Math.min(...regions.map(rect => Math.hypot(
    Math.max(rect.left - star.x, 0, star.x - rect.right),
    Math.max(rect.top - star.y, 0, star.y - rect.bottom),
  )));
  assert.ok(stars.filter(star => clearance(star) <= 32).length > 10);
  assert.ok(stars.filter(star => clearance(star) <= 32).every(star => star.opacity === 0));
  assert.ok(stars.some(star => star.opacity > 0 && star.opacity < unmasked[star.id].opacity));
  assert.ok(stars.filter(star => clearance(star) >= 132).every(star => star.opacity === unmasked[star.id].opacity));
});

function mountField(radius, hoverScale, parallaxDepth) {
  const previous = { window: globalThis.window, document: globalThis.document, IntersectionObserver: globalThis.IntersectionObserver };
  const media = new Map();
  const frames = new Map();
  let nextFrame = 0;
  let intersect;
  let disconnected = false;
  const star = (x, y) => ({ offsetLeft: x, offsetTop: y, style: { removeProperty(name) { delete this[name]; } } });
  const stars = [star(100, 200), star(700, 200), star(900, 500)];
  const surface = new EventTarget();
  const field = {
    dataset: {}, querySelectorAll: () => stars,
    getBoundingClientRect: () => ({ left: 16, top: 16, width: 1408, height: 868 }),
  };
  globalThis.document = Object.assign(new EventTarget(), { hidden: false });
  globalThis.window = Object.assign(new EventTarget(), {
    matchMedia(query) {
      if (!media.has(query)) media.set(query, Object.assign(new EventTarget(), { matches: query.includes('pointer: fine') }));
      return media.get(query);
    },
    requestAnimationFrame(callback) { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  globalThis.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  const cleanup = connectStarField({ surface, field, starSelector: '.ambient-star', radius, hoverScale, parallaxDepth });
  return {
    surface, field, stars, frames, media,
    intersect: visible => intersect([{ isIntersecting: visible }]),
    move(x, y) { surface.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: x + 16, clientY: y + 16 })); },
    flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    cleanup, disconnected: () => disconnected,
    restore() { cleanup(); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } },
  };
}

test('card and hero share local attraction, brightness, frame coalescing and release', () => {
  for (const radius of [undefined, width => Math.max(220, Math.min(300, width * .16))]) {
    const field = mountField(radius);
    try {
      assert.equal(field.field.dataset.playing, 'false');
      field.intersect(true);
      assert.equal(field.field.dataset.playing, 'true');
      field.move(120, 200);
      field.move(150, 200);
      assert.equal(field.frames.size, 1);
      field.flush();
      assert.ok(parseFloat(field.stars[0].style.transform.slice(10)) > 0);
      assert.ok(Number(field.stars[0].style.filter.match(/[\d.]+/)[0]) > 1);
      assert.equal(field.stars[1].style.transform, 'translate(0px, 0px) scale(1)');
      field.surface.dispatchEvent(new Event('pointerleave'));
      assert.equal(field.stars[0].style.transform, undefined);
      assert.equal(field.stars[0].style.filter, undefined);
    } finally { field.restore(); }
  }
});

test('hidden, offscreen and reduced-motion fields stop; interrupted pointers and teardown leave no work behind', () => {
  const field = mountField(undefined, undefined, index => [2, 5, 8][index % 3]);
  try {
    const motion = field.media.get('(prefers-reduced-motion: reduce)');
    const pointer = field.media.get('(hover: hover) and (pointer: fine)');
    field.intersect(true);
    for (const [disable, enable, pauses] of [
      [() => field.intersect(false), () => field.intersect(true), true],
      [() => { document.hidden = true; document.dispatchEvent(new Event('visibilitychange')); }, () => { document.hidden = false; document.dispatchEvent(new Event('visibilitychange')); }, true],
      [() => { motion.matches = true; motion.dispatchEvent(new Event('change')); }, () => { motion.matches = false; motion.dispatchEvent(new Event('change')); }, true],
      [() => { pointer.matches = false; pointer.dispatchEvent(new Event('change')); }, () => { pointer.matches = true; pointer.dispatchEvent(new Event('change')); }, false],
      [() => window.dispatchEvent(new Event('blur')), () => {}, false],
      [() => window.dispatchEvent(new Event('resize')), () => {}, false],
      [() => field.surface.dispatchEvent(new Event('pointercancel')), () => {}, false],
    ]) {
      field.move(150, 200);
      field.flush();
      field.move(160, 210);
      disable();
      assert.equal(field.frames.size, 0);
      assert.ok(field.stars.every(star => star.style.transform === undefined));
      if (pauses) {
        assert.equal(field.field.dataset.playing, 'false');
        field.move(150, 200);
        assert.equal(field.frames.size, 0);
      }
      enable();
    }
    field.move(150, 200);
    field.cleanup();
    assert.equal(field.frames.size, 0);
    assert.equal(field.disconnected(), true);
    field.move(150, 200);
    assert.equal(field.frames.size, 0);
    assert.equal(field.field.dataset.playing, undefined);
  } finally { field.restore(); }
});

test('hero depth shifts three layers opposite the cursor without enlarging them or changing local hover', () => {
  const field = mountField(undefined, undefined, index => [2, 5, 8][index % 3]);
  try {
    field.intersect(true);
    for (const [x, y, sign] of [[0, 0, 1], [1408, 868, -1], [1800, 1200, -1], [704, 434, 0]]) {
      field.move(x, y);
      field.flush();
      for (const [index, depth] of [2, 5, 8].entries()) {
        assert.equal(field.stars[index].style.transform, `translate(${sign * depth}px, ${sign * depth}px) scale(1)`);
        assert.equal(field.stars[index].style.filter, 'brightness(1)');
      }
      assert.equal(field.frames.size, 0);
    }
    field.move(100, 200);
    field.flush();
    assert.ok(field.stars[0].style.transform.endsWith('scale(1.65)'));
    assert.equal(field.stars[0].style.filter, 'brightness(2.8)');
    field.surface.dispatchEvent(new Event('pointerleave'));
    assert.ok(field.stars.every(star => star.style.transform === undefined));
  } finally { field.restore(); }
});


test('click wave travels outward, weakens with distance and has a finite center', () => {
  const near = starRipple(130, 140, 100, 100);
  const far = starRipple(340, 420, 100, 100);
  assert.ok(near.x > 0 && near.y > 0);
  assert.ok(near.delay > 0);
  assert.ok(far.delay > near.delay);
  assert.ok(Math.hypot(near.x, near.y) <= 24);
  assert.ok(far.strength < near.strength);
  assert.ok(starRipple(80, 70, 100, 100).x < 0);
  assert.equal(starRipple(760, 100, 100, 100), null);
  const center = starRipple(100, 100, 100, 100);
  assert.equal(center.x, 0);
  assert.equal(center.y, 0);
  assert.equal(center.delay, 0);
});


test('hero hover swells with proximity and holds without clicking', () => {
  const field = mountField(250, influence => 1 + 1.1 * influence * influence * (3 - 2 * influence));
  try {
    field.intersect(true);
    field.move(100, 200);
    field.flush();
    assert.equal(field.stars[0].style.transform, 'translate(0px, 0px) scale(2.1)');
    assert.equal(field.stars[1].style.transform, 'translate(0px, 0px) scale(1)');
    assert.equal(field.frames.size, 0);
    field.move(225, 200);
    field.flush();
    assert.ok(field.stars[0].style.transform.endsWith('scale(1.55)'));
    field.surface.dispatchEvent(new Event('pointerleave'));
    assert.equal(field.stars[0].style.transform, undefined);
  } finally { field.restore(); }
});
