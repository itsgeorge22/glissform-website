import test from 'node:test';
import assert from 'node:assert/strict';
import { animateSettingsFeatures } from '../src/home-next/settingsFeaturesMotion.ts';

class Events {
  listeners = new Map();
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, extras = {}) {
    const event = { target: new Element(), defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }, ...extras };
    for (const fn of this.listeners.get(type) || []) fn(event);
    return event;
  }
  size() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}
class Style {
  opacity = ''; transform = ''; visibility = '';
  setProperty(key, value) { this[key] = value; }
  removeProperty(key) { this[key] = ''; }
}
class Element {
  style = new Style(); attrs = new Map(); dataset = {}; selectors = {}; multiple = {}; clientHeight = 720;
  querySelector(key) { return this.selectors[key]; }
  querySelectorAll(key) { return this.multiple[key] || []; }
  setAttribute(key, value) { this.attrs.set(key, value); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  removeAttribute(key) { this.attrs.delete(key); if (key === 'data-motion') delete this.dataset.motion; }
  closest() { return null; }
}

test('feature playback preserves semantic content, reversed line exits and lifecycle cleanup', () => {
  let now = 0, nextFrame = 1, pinned = true;
  const frames = new Map(), window = new Events(), document = new Events();
  const reduced = new Events(), desktop = new Events();
  reduced.matches = false; desktop.matches = true; document.hidden = false;
  window.matchMedia = query => query.includes('reduced') ? reduced : desktop;
  const globals = { window, document, HTMLElement: Element, performance: { now: () => now },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => { const id = nextFrame++; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id) };
  const original = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true });
  const step = ms => {
    now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now));
  };
  const section = new Element(), stage = new Element();
  section.selectors['.settings-features__stage'] = stage;
  section.getBoundingClientRect = () => ({ top: pinned ? 0 : 120, bottom: pinned ? 720 : 840 });
  const items = Array.from({ length: 4 }, () => {
    const article = new Element(), copy = new Element(), panel = new Element();
    const title = new Element(), description = new Element();
    const lines = [new Element(), new Element(), new Element()];
    title.multiple['.text-reveal__content'] = lines.slice(0, 1);
    description.multiple['.text-reveal__content'] = lines.slice(1);
    copy.selectors = { '.settings-features__title': title, '.settings-features__description': description };
    copy.multiple['.text-reveal__content'] = lines;
    article.selectors = { '.settings-features__copy': copy, '.settings-features__panel': panel };
    return { article, copy, panel, lines };
  });
  stage.multiple['.settings-features__item'] = items.map(item => item.article);
  const visible = () => items.flatMap((item, index) => item.copy.style.visibility === 'visible' ? [index] : []);
  const semanticContentAvailable = () => assert.ok(items.every(({ article }) => article.getAttribute('aria-hidden') === null));
  const scale = line => Number(line.style.transform.match(/scale\(([\d.]+)\)/)?.[1] ?? 1);
  const key = key => window.emit('keydown', { key });
  let stop;
  try {
    stop = animateSettingsFeatures(section);
    assert.deepEqual(visible(), [0]); semanticContentAvailable();
    assert.equal(key('ArrowUp').defaultPrevented, false, 'first boundary releases native scroll');
    key('ArrowDown'); step(342);
    assert.equal(items[0].copy.style.opacity, '');
    assert.equal(items[0].copy.style.transform, '', 'the parent adds no separate fade or translation');
    assert.ok(items[0].lines.every(line => /rotateX\([\d.]+deg\)/.test(line.style.transform)),
      'each departing line folds out upward on down-scroll');
    assert.notEqual(items[0].lines[1].style.transform, items[0].lines[2].style.transform,
      'the supporting lines retain their reversed stagger');
    assert.ok(scale(items[0].lines[0]) < scale(items[0].lines[1])
      && scale(items[0].lines[1]) < scale(items[0].lines[2]),
    'upward departure folds headline, first subtitle line, then second subtitle line');
    assert.deepEqual(visible(), [0], 'only the outgoing copy is visible during departure');
    key('ArrowDown'); step(858);
    assert.deepEqual(visible(), [1], 'incoming copy follows the completed exit');
    assert.ok(scale(items[1].lines[0]) > scale(items[1].lines[1])
      && scale(items[1].lines[1]) > scale(items[1].lines[2]), 'upward arrival unfolds top to bottom');
    step(1100);
    semanticContentAvailable();
    assert.deepEqual(visible(), [1], 'input during playback does not queue another advance');
    assert.equal(frames.size, 0);
    key('ArrowUp'); step(342);
    assert.equal(items[1].copy.style.transform, '');
    assert.match(items[1].lines[0].style.transform, /translate3d\(0, [\d.]+px, 0\)/,
      'up-scroll sends the departing text downward regardless of its previous entrance');
    assert.ok(scale(items[1].lines[0]) > scale(items[1].lines[1])
      && scale(items[1].lines[1]) > scale(items[1].lines[2]), 'downward departure folds bottom to top');
    step(858);
    assert.match(items[0].lines[0].style.transform, /translate3d\(0, -/,
      'reverse incoming copy enters from above with its panel');
    assert.ok(scale(items[0].lines[0]) < scale(items[0].lines[1])
      && scale(items[0].lines[1]) < scale(items[0].lines[2]), 'downward arrival unfolds bottom to top');
    document.hidden = true; document.emit('visibilitychange');
    assert.deepEqual(visible(), [0]); assert.equal(frames.size, 0);
    document.hidden = false; document.emit('visibilitychange');
    pinned = false; assert.equal(key('ArrowDown').defaultPrevented, false); pinned = true;
    key('ArrowDown'); step(200);
    assert.match(items[0].lines[0].style.transform, /translate3d\(0, -/, 'down-scroll sends every departing line upward regardless of its previous entrance');
    reduced.matches = true; reduced.emit('change');
    assert.equal(section.dataset.motion, undefined); semanticContentAvailable();
    for (const { copy, lines } of items) {
      assert.equal(copy.style.transform, ''); assert.equal(copy.style.opacity, '');
      assert.ok(lines.every(line => line.style.transform === '' && line.style.opacity === ''));
    }
    reduced.matches = false; reduced.emit('change'); assert.deepEqual(visible(), [1]);
    assert.equal(items[1].copy.style.transform, '');
    assert.ok(items[1].lines.every(line => line.style.transform === 'none'));
    desktop.matches = false; desktop.emit('change'); assert.equal(section.dataset.motion, undefined);
    desktop.matches = true; desktop.emit('change'); assert.deepEqual(visible(), [1]);
    const y = line => Number(line.style.transform.match(/translate3d\(0, (-?[\d.]+)px, 0\)/)?.[1] ?? 0);
    const snapshot = () => items.map(item => ({ panel: item.panel.style.transform,
      visibility: item.copy.style.visibility,
      lines: item.lines.map(line => [line.style.transform, line.style.opacity]) }));
    const wheel = direction => window.emit('wheel', { deltaY: direction * 120, deltaX: 0 });

    // Reverse during the departure, turn forward again, then return to the
    // source. Neither direction change may restart or jump the rendered pose.
    wheel(1); step(400);
    let before = snapshot(), previousY = y(items[1].lines[0]);
    wheel(-1); assert.deepEqual(snapshot(), before);
    step(120); assert.ok(y(items[1].lines[0]) > previousY, 'all departing text turns downward immediately');
    before = snapshot(); previousY = y(items[1].lines[0]);
    wheel(1); assert.deepEqual(snapshot(), before);
    step(200); assert.ok(y(items[1].lines[0]) < previousY, 'a second reversal resumes upward motion');
    wheel(-1); step(2400); assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);

    // Reverse after the destination copy has appeared. It retreats continuously
    // and the original feature returns; no extra feature is queued.
    wheel(1); step(1500);
    assert.deepEqual(visible(), [2]);
    before = snapshot(); previousY = y(items[2].lines[0]);
    wheel(-1); assert.deepEqual(snapshot(), before);
    step(120); assert.ok(y(items[2].lines[0]) > previousY, 'incoming text also turns downward');
    step(2400); assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);

    // Keyboard reversals and page hiding settle toward the requested endpoint.
    key('ArrowDown'); step(500); key('ArrowUp');
    document.hidden = true; document.emit('visibilitychange');
    assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);
    document.hidden = false; document.emit('visibilitychange');
    // Repeat and alternate gestures: all visible lines, incoming and outgoing,
    // must travel in one direction independent of the feature's history.
    for (const direction of [1, 1, -1, 1, -1, -1, 1]) {
      key(direction > 0 ? 'ArrowDown' : 'ArrowUp');
      const previous = new Map();
      let movingLines = 0;
      for (let elapsed = 0; elapsed < 2250; elapsed += 150) {
        step(150);
        for (const item of items) {
          if (item.copy.style.visibility !== 'visible') continue;
          for (const line of item.lines) {
            const match = line.style.transform.match(/translate3d\(0, (-?[\d.]+)px, 0\)/);
            const y = match ? Number(match[1]) : 0;
            if (previous.has(line)) {
              const delta = y - previous.get(line);
              assert.ok(direction * delta <= 1e-8, 'headline and every supporting line follow the current scroll direction');
              if (Math.abs(delta) > .001) movingLines++;
            }
            previous.set(line, y);
          }
          assert.ok(item.lines.every(line => Math.abs(y(line) - y(item.lines[0])) < 1e-8),
            'headline and both subtitle lines always travel the same physical distance');
        }
      }
      assert.ok(movingLines > 10, 'check actual motion through both halves of the transition');
      semanticContentAvailable();
      assert.equal(frames.size, 0);
    }
    stop(); stop = undefined;
    assert.equal(window.size() + document.size() + reduced.size() + desktop.size(), 0);
    assert.equal(frames.size, 0); semanticContentAvailable();
  } finally {
    stop?.();
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
