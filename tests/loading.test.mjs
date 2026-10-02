import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the lazy boundary without requiring a GPU. The renderer's animation
// math is unchanged; this checks when it is requested and how teardown behaves.
const source = ts.transpileModule(readFileSync(new URL('../src/SeamlessCloseSection.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
function mount({ reduced = false, fail = false } = {}) {
  const style = { removeProperty(name) { if (name === 'min-height') this.minHeight = ''; } };
  const track = { style };
  const scene = { offsetHeight: 300 };
  const deviceStyle = { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } };
  const nodes = [{}, scene, track, { clientWidth: 360, style: deviceStyle }, {}];
  const preference = Object.assign(new EventTarget(), { matches: !reduced });
  const window = Object.assign(new EventTarget(), {
    innerHeight: 800,
    matchMedia: query => query.includes('prefers-reduced-motion') ? preference : { matches: true },
  });
  let intersect, cleanup, index = 0, requests = 0, mounted = 0, removed = 0, observersRemoved = 0;
  const exports = {};
  runInNewContext(source, {
    exports, window,
    IntersectionObserver: class {
      constructor(callback) { intersect = value => callback([{ isIntersecting: value }]); }
      observe(node) { assert.equal(node, scene); }
      disconnect() { observersRemoved++; }
    },
    ResizeObserver: class { observe() {} disconnect() {} },
    require: id => {
      if (id === 'react') return { useRef: () => ({ current: nodes[index++] }), useEffect: setup => { cleanup = setup(); } };
      if (id === 'react/jsx-runtime') return { jsx() {}, jsxs() {} };
      if (id === './MacBookShell') return { macBookGeometry: { width: 821, depth: 548, radius: 22 } };
      if (id === './seamlessMotion') {
        requests++;
        if (fail) throw new Error('Simulated chunk failure');
        return { mountSeamlessMotion: (...args) => { mounted++; args[4](); return () => { removed++; }; } };
      }
      return { default() {} };
    },
  });
  exports.default();
  return {
    track, window, deviceStyle, near: value => intersect(value), unmount: () => cleanup(),
    reduced: value => { preference.matches = !value; preference.dispatchEvent(new Event('change')); },
    get stats() { return { requests, mounted, removed, observersRemoved }; },
  };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('startup reserves geometry without requesting motion; approaching loads it once', async () => {
  const app = mount();
  assert.equal(app.track.style.minHeight, '1020px');
  assert.equal(app.stats.requests, 0);
  app.near(false);
  await flush();
  assert.equal(app.stats.requests, 0);
  app.near(true);
  app.near(true);
  await flush();
  assert.equal(app.stats.requests, 1);
  assert.equal(app.stats.mounted, 1);
  assert.equal(app.track.style.minHeight, '');
  app.unmount();
  assert.equal(app.stats.removed, 1);
  assert.equal(app.stats.observersRemoved, 1);
});

test('Reduce Motion skips both the import and reserved space, and can be changed live', async () => {
  const app = mount({ reduced: true });
  app.near(true);
  await flush();
  assert.equal(app.stats.requests, 0);
  assert.equal(app.track.style.minHeight, '');
  assert.equal(app.deviceStyle['--macbook-scale'], '0.4');
  app.reduced(false);
  await flush();
  assert.equal(app.stats.mounted, 1);
  app.unmount();
});

test('unmount during a pending import never attaches a late renderer', async () => {
  const app = mount();
  app.near(true);
  app.unmount();
  await flush();
  assert.equal(app.stats.mounted, 0);
  assert.equal(app.track.style.minHeight, '');
});

test('a failed chunk releases reserved space and keeps the static markup usable', async () => {
  const app = mount({ fail: true });
  app.near(true);
  await flush();
  assert.equal(app.stats.mounted, 0);
  assert.equal(app.track.style.minHeight, '');
  app.unmount();
});
