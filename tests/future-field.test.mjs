import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as motion from '../src/futureFieldMotion.ts';
import { advanceField, createFieldParticles, fieldDepthFade, FIELD_BLEED, FIELD_HEIGHT, FIELD_WIDTH, FIELD_ORIGINAL_OFFSET_Y } from '../src/futureFieldMotion.ts';
import { futureFieldDots } from '../src/futureFieldDots.ts';

const absent = { x: 0, y: 0, strength: 0 };
const cursor = { x: 620, y: 145, strength: 1 };

function run(particles, pointer, start, duration, hz = 60) {
  for (let i = 1; i <= duration * hz; i++) advanceField(particles, start + i / hz, 1 / hz, pointer);
}

test('the extended sheet preserves the original dots with no oversized focal point', () => {
  const dots = createFieldParticles();
  assert.ok(dots.length > futureFieldDots.length * 3);
  const positions = new Set(dots.map(dot => `${dot.homeX}:${dot.homeY}`));
  assert.equal(positions.size, dots.length);
  assert.ok(futureFieldDots.every(([x, y]) => positions.has(`${x}:${y + FIELD_ORIGINAL_OFFSET_Y}`)));
  assert.ok(dots.every(dot => dot.radius > 1 && dot.radius < 2.5));
  assert.ok(dots.some(dot => dot.homeX < -180));
  assert.ok(dots.some(dot => dot.homeX > FIELD_WIDTH + 180));
  assert.ok(dots.some(dot => dot.homeY < -180));
  assert.ok(dots.some(dot => dot.homeY > FIELD_HEIGHT + 180));
});

test('the idle sheet has visible depth while its fade stays at the viewport edges', () => {
  const dots = createFieldParticles();
  advanceField(dots, 0, 0, absent);
  const initial = dots.map(dot => dot.y);
  run(dots, absent, 0, 2);
  assert.ok(dots.some((dot, i) => Math.abs(dot.y - initial[i]) > 30));
  assert.ok(dots.every(dot => Math.abs(dot.y - dot.homeY) < 35));
  assert.ok(dots.filter(dot => dot.x < 1 || dot.x > FIELD_WIDTH - 1 || dot.y < 1 || dot.y > FIELD_HEIGHT - 1)
    .every(dot => dot.alpha < .002));
});

test('the same dot is higher and a stronger blue on a crest than in a trough', () => {
  const dots = createFieldParticles();
  const dot = dots.find(dot => Math.abs(dot.homeX - 564) < 2 && Math.abs(dot.homeY - 141) < 10);
  let high = { elevation: -Infinity };
  let low = { elevation: Infinity };
  for (let i = 0; i < 100; i++) {
    advanceField(dots, i / 10, 0, absent);
    const sample = { elevation: dot.elevation, y: dot.y, color: dot.color, alpha: dot.alpha };
    if (sample.elevation > high.elevation) high = sample;
    if (sample.elevation < low.elevation) low = sample;
  }
  const blueContrast = color => { const [r, , b] = color.match(/\d+/g).map(Number); return b - r; };
  assert.ok(high.y < low.y - 30);
  assert.ok(blueContrast(high.color) > blueContrast(low.color) + 100);
  assert.ok(high.alpha > low.alpha + .1);
});

test('reserve rows enter at the top and bottom without revealing a hard cutoff', () => {
  const dots = createFieldParticles();
  let fromTop = false;
  let fromBottom = false;
  for (let i = 0; i < 240; i++) {
    advanceField(dots, i / 30, 1 / 30, { x: 564, y: i < 120 ? 20 : FIELD_HEIGHT - 20, strength: 1 });
    fromTop ||= dots.some(dot => dot.homeY < 0 && dot.y > 5 && dot.alpha > .01);
    fromBottom ||= dots.some(dot => dot.homeY > FIELD_HEIGHT && dot.y < FIELD_HEIGHT - 5 && dot.alpha > .01);
    assert.ok(dots.filter(dot => dot.y < 0 || dot.y > FIELD_HEIGHT || dot.x < 0 || dot.x > FIELD_WIDTH)
      .every(dot => dot.alpha === 0));
  }
  assert.ok(fromTop && fromBottom);
});

test('nearby dots attract and brighten without growing or stopping the wave', () => {
  const idle = createFieldParticles();
  const active = createFieldParticles();
  run(idle, absent, 0, 2);
  run(active, cursor, 0, 2);
  const nearIndex = active.findIndex(dot => dot.homeX > 660 && dot.homeX < 685 && dot.homeY > 135 && dot.homeY < 155);
  const dot = active[nearIndex];
  assert.ok(Math.hypot(dot.x - cursor.x, dot.y - cursor.y) < Math.hypot(idle[nearIndex].x - cursor.x, idle[nearIndex].y - cursor.y));
  assert.ok(dot.light > .5);
  assert.notEqual(dot.color, idle[nearIndex].color);
  assert.equal(dot.radius, idle[nearIndex].radius);
  active.forEach((particle, i) => {
    if (Math.abs(particle.homeX - cursor.x) > 220) {
      assert.equal(particle.x, idle[i].x);
      assert.equal(particle.y, idle[i].y);
      assert.equal(particle.color, idle[i].color);
    }
  });
});

test('leaving settles back into the ongoing wave with no residual offset or highlight', () => {
  const active = createFieldParticles();
  run(active, cursor, 0, 2);
  run(active, absent, 2, 2);
  const idle = createFieldParticles();
  advanceField(idle, 4, 0, absent);
  active.forEach((dot, i) => {
    assert.ok(Math.abs(dot.x - idle[i].x) < .01);
    assert.ok(Math.abs(dot.y - idle[i].y) < .01);
    assert.ok(dot.light < .001);
  });
});

test('fast direction changes stay finite and cannot exhaust the reserve sheet', () => {
  const dots = createFieldParticles();
  for (let i = 0; i < 900; i++) {
    const x = (i % 40 < 20 ? .15 : .85) * FIELD_WIDTH;
    const y = (i % 16 < 8 ? .1 : .9) * FIELD_HEIGHT;
    advanceField(dots, i / 60, i % 100 === 0 ? 2 : 1 / 60, { x, y, strength: 1 });
    for (const dot of dots) {
      assert.ok(Number.isFinite(dot.x) && Number.isFinite(dot.y));
      assert.ok(Math.hypot(dot.offsetX, dot.offsetY) < 25);
      assert.ok(Math.abs(dot.x - dot.homeX) < FIELD_BLEED / 3);
      assert.ok(Math.abs(dot.y - dot.homeY) < FIELD_BLEED / 3);
      assert.ok(dot.alpha >= 0 && dot.alpha <= 1);
    }
  }
});

test('cursor settling agrees across 30, 60 and 120 Hz', () => {
  const results = [30, 60, 120].map(hz => {
    const dots = createFieldParticles();
    run(dots, cursor, 0, 2, hz);
    return dots;
  });
  results[0].forEach((dot, i) => {
    for (const other of [results[1][i], results[2][i]]) {
      assert.ok(Math.hypot(dot.x - other.x, dot.y - other.y) < .25);
      assert.ok(Math.abs(dot.light - other.light) < .005);
    }
  });
});

test('short diagonal fades affect only the top-left and bottom-right corners', () => {
  const fade = fieldDepthFade(80, 80);
  assert.ok(fade > .35 && fade < .8);
  assert.equal(fade, fieldDepthFade(FIELD_WIDTH - 80, FIELD_HEIGHT - 80));
  assert.equal(fieldDepthFade(FIELD_WIDTH - 80, 80), 1);
  assert.equal(fieldDepthFade(80, FIELD_HEIGHT - 80), 1);
  assert.equal(fieldDepthFade(FIELD_WIDTH / 2, FIELD_HEIGHT / 2), 1);
  assert.equal(fieldDepthFade(240, 80), 1);
});

test('the idle crest travels left to right across a horizontal row', () => {
  const template = createFieldParticles()[0];
  const row = Array.from({ length: 101 }, (_, index) => ({ ...template, homeX: 60 + index * 10, homeY: FIELD_HEIGHT / 2, flatY: FIELD_HEIGHT / 2 }));
  advanceField(row, 0, 0, absent);
  const peak = () => row.reduce((highest, dot) => dot.elevation > highest.elevation ? dot : highest).homeX;
  const before = peak();
  advanceField(row, 1, 0, absent);
  assert.ok(peak() > before + 80 && peak() < before + 160);
});

// Exercise the component's effect with controlled browser events and a frame queue.
// This covers scheduling and teardown without relying on wall-clock timing or a GPU.
function mountField({ reduced = false, available = true } = {}) {
  const samples = [];
  const media = new Map();
  const queue = new Map();
  let nextFrame = 0;
  let draws = 0;
  let transform = [];
  let intersect;
  let cleanup;
  const field = Object.assign(new EventTarget(), {
    dataset: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: FIELD_WIDTH, height: FIELD_HEIGHT }),
  });
  const context = {
    clearRect: () => { draws++; },
    beginPath() {}, arc() {}, fill() {},
    setTransform: (...values) => { transform = values; },
  };
  const canvas = Object.assign(new EventTarget(), {
    width: FIELD_WIDTH, height: FIELD_HEIGHT,
    getContext: () => available ? context : null,
  });
  const document = Object.assign(new EventTarget(), { hidden: false });
  const window = Object.assign(new EventTarget(), {
    devicePixelRatio: 3,
    requestAnimationFrame: callback => { queue.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => queue.delete(id),
    matchMedia: query => {
      const value = Object.assign(new EventTarget(), { matches: query.includes('reduce') ? reduced : true });
      media.set(query, value);
      return value;
    },
  });
  const source = ts.transpileModule(readFileSync(new URL('../src/FutureField.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let refIndex = 0;
  const exports = {};
  runInNewContext(source, {
    exports, window, document,
    IntersectionObserver: class {
      constructor(callback) { intersect = visible => callback([{ isIntersecting: visible }]); }
      observe() {} disconnect() {}
    },
    ResizeObserver: class { observe() {} disconnect() {} },
    require: id => {
      if (id === 'react') return {
        useRef: () => ({ current: refIndex++ === 0 ? field : canvas }),
        useEffect: setup => { cleanup = setup(); },
      };
      if (id === 'react/jsx-runtime') return { jsx() {}, jsxs() {} };
      if (id === './futureFieldMotion') return {
        ...motion,
        advanceField: (...args) => {
          motion.advanceField(...args);
          samples.push({ time: args[1], strength: args[3].strength, height: Math.max(...args[0].map(dot => dot.elevation)) });
        },
      };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  exports.default();
  return {
    field, canvas, document, window, queue, samples,
    get draws() { return draws; },
    get transform() { return transform; },
    visible: value => intersect(value),
    preference: (query, matches) => { const value = media.get(query); value.matches = matches; value.dispatchEvent(new Event('change')); },
    tick: timestamp => {
      const callbacks = Array.from(queue.values());
      queue.clear();
      callbacks.forEach(callback => callback(timestamp));
    },
    unmount: () => cleanup?.(),
  };
}

test('rendering suspends offscreen, hidden, below the breakpoint and with Reduce Motion', () => {
  const app = mountField();
  assert.equal(app.queue.size, 0);
  assert.equal(app.canvas.width, FIELD_WIDTH); // No backing-store allocation or drawing offscreen.
  assert.equal(app.draws, 0);
  app.visible(true);
  assert.equal(app.canvas.width, 2256); // DPR is capped at 2, even on a 3x screen.
  assert.equal(app.queue.size, 1);
  app.tick(100);
  assert.equal(app.field.dataset.ready, 'true');
  assert.equal(app.queue.size, 1);
  app.preference('(prefers-reduced-motion: reduce)', true);
  assert.equal(app.queue.size, 0);
  assert.equal(app.field.dataset.ready, 'false');
  const draws = app.draws;
  app.tick(200);
  assert.equal(app.draws, draws);
  app.preference('(prefers-reduced-motion: reduce)', false);
  assert.equal(app.queue.size, 1);
  app.document.hidden = true;
  app.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(app.queue.size, 0);
  app.document.hidden = false;
  app.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(app.queue.size, 1);
  app.preference('(min-width: 1156px)', false);
  assert.equal(app.queue.size, 0);
  app.preference('(min-width: 1156px)', true);
  assert.equal(app.queue.size, 1);
  app.visible(false);
  assert.equal(app.queue.size, 0);
  app.visible(true);
  app.unmount();
  assert.equal(app.queue.size, 0);
  app.window.dispatchEvent(new Event('resize'));
  app.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(app.queue.size, 0);
});

test('initial Reduce Motion or unavailable canvas keeps the SVG fallback without frame work', () => {
  for (const options of [{ reduced: true }, { available: false }]) {
    const app = mountField(options);
    if (options.reduced) app.visible(true);
    assert.equal(app.queue.size, 0);
    assert.equal(app.draws, 0);
    assert.notEqual(app.field.dataset.ready, 'true');
    app.unmount();
  }
});

test('context loss shows the static fallback, then restores rendering at the right scale', () => {
  const app = mountField();
  app.visible(true);
  app.tick(100);
  app.canvas.dispatchEvent(new Event('contextlost'));
  assert.equal(app.field.dataset.ready, 'false');
  assert.equal(app.queue.size, 0);
  app.canvas.dispatchEvent(new Event('contextrestored'));
  assert.deepEqual(app.transform, [2, 0, 0, 2, 0, 0]);
  assert.equal(app.queue.size, 1);
  assert.equal(app.field.dataset.ready, 'true');
  app.unmount();
});

test('hover keeps the wave clock and depth running while magnetic feedback responds', () => {
  const app = mountField();
  app.visible(true);
  app.tick(100);
  app.field.dispatchEvent(Object.assign(new Event('pointerenter'), { clientX: 620, clientY: 145, pointerType: 'mouse' }));
  for (let frame = 1; frame <= 480; frame++) app.tick(100 + frame * 1000 / 60);
  const hovered = app.samples.at(-1);
  assert.ok(Math.abs(hovered.time - 8) < .0001);
  assert.ok(hovered.strength > .99);
  assert.ok(hovered.height > .5);
  assert.equal(app.field.dataset.waveState, 'flowing');
  app.field.dispatchEvent(new Event('pointerleave'));
  for (let frame = 481; frame <= 600; frame++) app.tick(100 + frame * 1000 / 60);
  const released = app.samples.at(-1);
  assert.ok(Math.abs(released.time - 10) < .0001);
  assert.ok(released.strength < .001);
  assert.ok(released.height > .5);
  app.unmount();
});
