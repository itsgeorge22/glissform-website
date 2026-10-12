import test from 'node:test';
import assert from 'node:assert/strict';
import { animateEasyToReach } from '../src/home-next/easyToReachMotion.ts';

test('a clock-width change smoothly retargets the hovered cursor without restarting the menu', () => {
  const events = () => ({ addEventListener() {}, removeEventListener() {} });
  const style = () => ({ setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } });
  const root = { dataset: {}, style: style(), clientWidth: 696, clientHeight: 854,
    removeAttribute() { delete this.dataset.playing; } };
  const desktop = { offsetLeft: -1748, offsetTop: 199, offsetParent: root };
  const bar = { offsetLeft: 1893, offsetTop: 20, offsetParent: desktop };
  const icon = { offsetLeft: 0, offsetTop: 0, offsetWidth: 80, offsetHeight: 48, offsetParent: bar };
  const menu = { style: style() }, cursor = { style: style() };
  const elements = { '.feature-menu-bar': bar, '.feature-menu-bar__app': icon,
    '.easy-to-reach-visual__menu': menu, '.feature-cursor': cursor };
  root.querySelector = selector => elements[selector];
  root.closest = () => ({ dataset: { featureActive: 'true', featureDeparting: 'false' } });
  const frames = new Map();
  let resize, intersection, now = 100, nextId = 0;
  const globals = {
    window: { matchMedia: query => ({ ...events(), matches: !query.includes('reduced') }) },
    document: { ...events(), hidden: false },
    getComputedStyle: () => ({ fontSize: '1px' }),
    requestAnimationFrame: fn => { frames.set(++nextId, fn); return nextId; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() {} },
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} disconnect() {} },
  };
  const originals = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true });
  const step = ms => { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); };
  const cursorX = () => Number(cursor.style.transform.match(/translate3d\(([-\d.]+)px/)[1]);
  let stop;
  try {
    stop = animateEasyToReach(root);
    intersection([{ isIntersecting: true, intersectionRatio: 1 }]);
    step(16); step(2850);
    assert.equal(cursorX(), 185); assert.equal(root.style['--menu-open'], '1');
    bar.offsetLeft -= 28; resize();
    assert.equal(cursorX(), 185, 'cursor keeps its current position at retargeting');
    step(90); assert.ok(cursorX() < 185 && cursorX() > 157, 'cursor follows smoothly');
    step(100); assert.equal(cursorX(), 157, 'cursor reaches the new icon center');
    assert.equal(root.style['--menu-open'], '1', 'width changes do not restart the menu sequence');
    assert.equal(root.dataset.playing, 'true');
  } finally {
    stop?.();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
