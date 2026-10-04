import test from 'node:test';
import assert from 'node:assert/strict';
import { requestSceneFrame, cancelHeroFrame, registerHeroInteraction, setHeroScreenProjection, getHeroScreenProjection } from '../src/hero-test-animation/frameSync.ts';

test('scene and pointer work share a frame, use the latest projection, and cancel cleanly', t => {
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  const frames = new Map();
  let next = 1;
  globalThis.requestAnimationFrame = callback => { const id = next++; frames.set(id, callback); return id; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  t.after(() => {
    globalThis.requestAnimationFrame = previousRequest;
    globalThis.cancelAnimationFrame = previousCancel;
  });
  const drawFrame = time => {
    assert.equal(frames.size, 1, 'one browser RAF owns all currently pending work');
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback(time);
  };
  const calls = [];
  const projection = { quad: [{ x: 16, y: 16 }, { x: 1016, y: 16 }, { x: 1016, y: 616 }, { x: 16, y: 616 }], width: 1000, height: 600, interactive: true };
  const pointer = registerHeroInteraction(value => calls.push(['pointer', value]));
  pointer.request(); pointer.request();
  requestSceneFrame(() => {
    calls.push(['scene']);
    setHeroScreenProjection(projection);
    requestSceneFrame(() => calls.push(['next scene']));
  });
  const cancelled = requestSceneFrame(() => assert.fail('cancelled scene must not run'));
  cancelHeroFrame(cancelled);
  drawFrame(16);
  assert.deepEqual(calls, [['scene'], ['pointer', projection]]);
  assert.equal(getHeroScreenProjection(), projection);
  drawFrame(32);
  assert.deepEqual(calls.at(-1), ['next scene']);
  assert.equal(frames.size, 0, 'settled controls do not leave a render loop alive');

  pointer.request();
  pointer.dispose();
  assert.equal(frames.size, 0, 'disposing a pending interaction cancels the empty RAF');
  const restored = registerHeroInteraction(value => calls.push(['restored', value]));
  drawFrame(48);
  assert.deepEqual(calls.at(-1), ['restored', projection], 'a newly mounted control receives the current pose');
  restored.dispose();
  setHeroScreenProjection(null);
  assert.equal(frames.size, 0);
});
