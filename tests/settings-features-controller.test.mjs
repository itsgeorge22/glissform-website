import test from 'node:test';
import assert from 'node:assert/strict';
import { animateSettingsFeatures } from '../src/home-next/settingsFeaturesMotion.ts';
import { setFeatureEntry } from '../src/home-next/featureEntry.ts';
import { settingsFeaturesTiming } from '../src/home-next/settingsFeaturesChoreography.ts';

const forwardDuration = settingsFeaturesTiming.duration + settingsFeaturesTiming.upwardIconLeadMs;

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
    assert.equal(items[0].panel.getAttribute('data-feature-departing'), 'true');
    assert.equal(items[1].panel.getAttribute('data-feature-active'), 'false', 'incoming demo waits for settlement');
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
    window.emit('keydown', { key: 'ArrowDown', repeat: true }); step(858);
    assert.deepEqual(visible(), [1], 'incoming copy follows the completed exit');
    assert.ok(scale(items[1].lines[0]) > scale(items[1].lines[1])
      && scale(items[1].lines[1]) > scale(items[1].lines[2]), 'upward arrival unfolds top to bottom');
    step(1100);
    assert.equal(items[0].panel.getAttribute('data-feature-departing'), 'false');
    assert.equal(items[1].panel.getAttribute('data-feature-active'), 'true');
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
    assert.equal(items[1].panel.getAttribute('data-feature-departing'), 'true', 'reversal retains the original demo');
    step(120); assert.ok(y(items[1].lines[0]) > previousY, 'all departing text turns downward immediately');
    before = snapshot(); previousY = y(items[1].lines[0]);
    wheel(1); assert.deepEqual(snapshot(), before);
    step(200); assert.ok(y(items[1].lines[0]) < previousY, 'a second reversal resumes upward motion');
    wheel(-1); step(2400); assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);
    assert.equal(items[1].panel.getAttribute('data-feature-active'), 'true');
    assert.equal(items[1].panel.getAttribute('data-feature-departing'), 'false');

    // Reverse after the destination copy has appeared. It retreats continuously
    // and the original feature returns; no extra feature is queued.
    wheel(1); step(forwardDuration - 400);
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
    const restart = () => {
      stop(); now += 1000; pinned = true;
      stop = animateSettingsFeatures(section);
    };
    // Entering the section must not inherit a consumed gesture from the page.
    restart(); pinned = false; wheel(1); step(40); pinned = true; wheel(1);
    step(2000); assert.deepEqual(visible(), [1], 'entry scroll starts the first handoff');

    // A long decaying tail advances only once, even beyond animation completion.
    restart(); wheel(1);
    for (let i = 0; i < 100; i++) {
      step(40); window.emit('wheel', { deltaY: 120 * Math.pow(.94, i + 1), deltaX: 0 });
    }
    assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);

    restart(); wheel(1);
    for (let i = 0; i < 100; i++) { step(40); wheel(1); }
    assert.deepEqual(visible(), [1], 'continuous strong scrolling cannot advance twice');
    assert.equal(frames.size, 0);

    restart(); wheel(1); step(forwardDuration - 20);
    window.emit('wheel', { deltaY: 2, deltaX: 0 });
    now += 20; wheel(1); // Complete the timeline from the event, before RAF.
    step(16); assert.notEqual(items[1].panel.style.transform, 'none',
      'fresh input at the exact endpoint starts the next departure immediately');
    step(2000); assert.deepEqual(visible(), [2]);
    assert.equal(frames.size, 0);

    // Extra requests during playback are discarded, including the quiet ending.
    restart(); wheel(1); step(forwardDuration - 300); wheel(1);
    step(299); assert.deepEqual(visible(), [1]);
    step(1); step(1);
    assert.equal(frames.size, 0, 'settling never starts an automatic handoff');
    step(2000); assert.deepEqual(visible(), [1]);
    step(2000); assert.equal(frames.size, 0, 'no automatic third advance');

    restart(); wheel(1); step(500); wheel(1); step(500); wheel(1);
    step(800); step(1800);
    assert.deepEqual(visible(), [1], 'multiple early requests never queue another step');
    assert.equal(frames.size, 0);

    restart(); key('ArrowDown'); step(500); key('ArrowDown');
    step(500); key('PageDown'); step(3000);
    assert.deepEqual(visible(), [1], 'separate key presses during playback also cannot queue');
    assert.equal(frames.size, 0);

    // A wheel event can complete the old timeline before its scheduled frame.
    restart(); wheel(1); step(forwardDuration - 300); wheel(1);
    now += 160; window.emit('wheel', { deltaY: 100, deltaX: 0 });
    now += 81; window.emit('wheel', { deltaY: 90, deltaX: 0 });
    now += 60; window.emit('wheel', { deltaY: 80, deltaX: 0 });
    step(16); assert.equal(frames.size, 0, 'completion outside RAF cannot start another step');
    step(2000); assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);

    // Reversing retraces the same rendered poses.
    restart(); wheel(1); step(500); wheel(1);
    before = snapshot(); wheel(-1); assert.deepEqual(snapshot(), before);
    step(2000); assert.deepEqual(visible(), [0]); assert.equal(frames.size, 0);

    // Scrolling resumes only after a pause; renewed pressure remains one burst.
    restart(); wheel(1);
    for (let i = 0; i < 20; i++) {
      step(100); window.emit('wheel', { deltaY: i % 2 ? 2400 : 1, deltaX: 0 });
    }
    step(150); wheel(1);
    step(2000); assert.deepEqual(visible(), [2], 'a deliberate stroke after settling and a short pause advances');

    restart(); wheel(1);
    for (let i = 0; i < 50; i++) {
      step(40); window.emit('wheel', { deltaY: 120 * Math.pow(.9, i + 1), deltaX: 0 });
    }
    step(20); window.emit('wheel', { deltaY: 12, deltaX: 0 });
    step(20); window.emit('wheel', { deltaY: 24, deltaX: 0 });
    step(2000); assert.deepEqual(visible(), [2], 'new strong input after a quiet tail is recognized once settled');

    // Discarded input never returns after backgrounding or leaving the section.
    restart(); wheel(1); step(500); wheel(1);
    document.hidden = true; document.emit('visibilitychange');
    document.hidden = false; document.emit('visibilitychange');
    step(2000); assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0);
    restart(); wheel(1); step(500); wheel(1);
    pinned = false; window.emit('scroll'); pinned = true; step(2000);
    assert.deepEqual(visible(), [1]); assert.equal(frames.size, 0, 'leaving the section clears pending input');

    // The Mac reveal introduces the first feature in place, and an inherited
    // wheel tail cannot immediately skip that introduction.
    stop(); pinned = false;
    setFeatureEntry({ linked: true, ready: false, coverage: 0 });
    stop = animateSettingsFeatures(section, true);
    assert.deepEqual(visible(), []);
    assert.ok(items.every(item => item.panel.style.opacity === '0'));
    setFeatureEntry({ linked: true, ready: false, coverage: .8 });
    wheel(1); window.emit('scroll'); step(40);
    assert.ok(Number(items[0].panel.style.opacity) > 0, 'the feature begins before the dive endpoint');
    const earlyOpacity = Number(items[0].panel.style.opacity);
    step(160);
    assert.ok(Number(items[0].panel.style.opacity) > earlyOpacity, 'early entrance advances on time without further scroll');
    const beforeEndpoint = snapshot();
    pinned = true;
    setFeatureEntry({ linked: true, ready: true, coverage: 1 });
    assert.deepEqual(snapshot(), beforeEndpoint, 'reaching the endpoint does not restart the entrance');
    for (let i = 0; i < 8; i++) {
      step(40); window.emit('wheel', { deltaY: 100 * Math.pow(.9, i), deltaX: 0 });
    }
    assert.deepEqual(visible(), [0]);
    assert.ok(items[0].lines.every(line => line.style.transform !== 'none'), 'the shared text reveal is running');
    assert.match(items[0].panel.style.transform, /scale\(/, 'the placeholder has its own composed entrance');
    for (let i = 8; i < 43; i++) {
      step(40); window.emit('wheel', { deltaY: 100 * Math.pow(.9, i), deltaX: 0 });
    }
    assert.deepEqual(visible(), [0], 'entry momentum never requests feature two');
    assert.equal(items[0].panel.style.transform, 'none');
    assert.equal(frames.size, 0);
    pinned = false;
    setFeatureEntry({ linked: true, ready: false, coverage: .3, returning: true });
    assert.equal(items[0].panel.getAttribute('data-feature-departing'), 'true',
      'the visible feature demo keeps playing while the Mac is uncovered');
    assert.notEqual(items[0].lines[0].style.transform, 'none', 'the scroll return drives the shared exit poses');
    setFeatureEntry({ linked: true, ready: false, coverage: .001, returning: true });
    assert.equal(items[0].panel.getAttribute('data-feature-departing'), 'false');
    assert.ok(items.every(item => item.panel.style.opacity === '0' && item.panel.style.visibility === 'hidden'),
      'the negligible fade tail is fully removed from painting over the returning Mac');
    setFeatureEntry({ linked: true, ready: false, coverage: 0, returning: true });
    assert.deepEqual(visible(), []); assert.equal(frames.size, 0);
    assert.ok(items.every(item => item.panel.style.opacity === '0'), 'the feature disappears with the last white coverage');
    setFeatureEntry({ linked: true, ready: false, coverage: .3, returning: true });
    assert.deepEqual(visible(), [], 'forward scrolling does not scrub the feature back in');
    assert.ok(items.every(item => item.panel.style.visibility === 'hidden'), 'the dismissed feature waits for the dive endpoint');
    setFeatureEntry({ linked: true, ready: true, coverage: 1 });
    step(300); assert.ok(Number(items[0].panel.style.opacity) > 0, 'entrance plays without further scroll');
    step(1000); assert.equal(items[0].panel.style.transform, 'none');
    setFeatureEntry({ linked: true, ready: false, coverage: 0, returning: true });
    setFeatureEntry({ linked: true, ready: false, coverage: 0, returning: false });
    pinned = true;
    setFeatureEntry({ linked: true, ready: true, coverage: 1 }); step(300);
    assert.equal(window.emit('wheel', { deltaY: -4, deltaX: 0 }).defaultPrevented, false,
      'upward input can return to the Mac immediately, even during the timed feature entrance');
    const partialEntrance = snapshot();
    setFeatureEntry({ linked: true, ready: false, coverage: 1, returning: true });
    assert.deepEqual(snapshot(), partialEntrance, 'returning during entrance must not jump to the fully visible feature');
    step(200); assert.deepEqual(snapshot(), partialEntrance);
    setFeatureEntry({ linked: true, ready: false, coverage: .1, returning: true });
    const dismissedPose = snapshot();
    setFeatureEntry({ linked: true, ready: false, coverage: 1, returning: true });
    assert.equal(items[0].panel.style.transform, dismissedPose[0].panel, 'crossing the early entrance cue resumes the dismissed pose without a jump');
    setFeatureEntry({ linked: true, ready: true, coverage: 1 });
    assert.equal(items[0].panel.style.transform, dismissedPose[0].panel, 'automatic entrance resumes without a panel jump');
    assert.ok(Math.abs(Number(items[0].lines[0].style.opacity) - Number(dismissedPose[0].lines[0][1])) < 1e-12, 'copy resumes continuously');
    step(400); assert.notDeepEqual(snapshot(), dismissedPose, 'the entrance advances on time alone');
    document.hidden = true; document.emit('visibilitychange');
    assert.equal(frames.size, 0);
    document.hidden = false; document.emit('visibilitychange');
    assert.equal(items[0].panel.style.transform, 'none', 'backgrounding settles without a later replay');
    // Returning to the shared feature boundary must finish the copy handoff,
    // even when coverage has subpixel rounding residue.
    for (const coverage of [.999, 1 - Number.EPSILON]) {
      pinned = false;
      setFeatureEntry({ linked: true, ready: false, coverage: .4, returning: true });
      pinned = true;
      setFeatureEntry({ linked: true, ready: true, coverage, returning: true });
      step(2000);
      key('ArrowDown'); step(2000);
      assert.deepEqual(visible(), [1], 'copy advances after returning from Logo Dive');
      assert.equal(items[1].panel.style.transform, 'none', 'copy and placeholder select the same feature');
      key('ArrowDown'); step(2000);
      assert.deepEqual(visible(), [2], 'later copy remains navigable');
      key('ArrowUp'); step(2000);
      key('ArrowUp'); step(2000);
    }
    key('ArrowDown'); step(400);
    setFeatureEntry({ linked: false, ready: false, coverage: 0 });
    assert.deepEqual(visible(), [1], 'graphics fallback settles a handoff before restoring normal section layout');
    assert.equal(frames.size, 0);
    reduced.matches = true; reduced.emit('change');
    assert.ok(items.every(item => item.panel.style.opacity === '' && item.panel.style.transform === '' && item.panel.style.visibility === ''));
    setFeatureEntry({ linked: false, ready: false, coverage: 0 });
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
