import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopReturnPreview } from '../src/desktopReturnPreview.ts';

function layer() {
  return {
    style: {}, animations: [], poses: [],
    animate(frames, options) {
      let resolve, reject, observed = false;
      const done = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = {
        frames, options, cancelled: false, progress: 0,
        effect: { getComputedTiming: () => ({ progress: animation.progress }) },
        get finished() { observed = true; return done; },
        finish() { resolve(); },
        cancel() { this.cancelled = true; if (observed) reject(new Error('cancelled')); },
      };
      this.animations.push(animation);
      return animation;
    },
  };
}
function setup() {
  const fold = layer(), connection = layer(), jobs = new Map(), drawFrames = new Map(), phases = [];
  let now = 0, next = 0, reduced = false;
  const preview = createDesktopReturnPreview({
    fold, connection, onPhase: phase => phases.push(phase), reducedMotion: () => reduced,
    render: degrees => fold.poses.push(degrees),
    schedule: (callback, delay) => { jobs.set(++next, { at: now + delay, callback }); return next; },
    unschedule: id => jobs.delete(id),
    requestFrame: callback => { drawFrames.set(++next, callback); return next; },
    cancelFrame: id => drawFrames.delete(id),
  });
  const sample = progress => {
    fold.animations.at(-1).progress = progress;
    for (const [id, callback] of [...drawFrames]) { drawFrames.delete(id); callback(now); }
  };
  return {
    fold, connection, phases, preview, drawFrames, sample,
    advance(ms) { now += ms; for (const [id, job] of jobs) if (job.at <= now) { jobs.delete(id); job.callback(); } },
    reduce() { reduced = true; preview.reset(); },
    async finishReturn() { sample(1); fold.animations.at(-1).finish(); await Promise.resolve(); },
  };
}

test('Pause and Esc move the same single screen, with only Pause waiting one second', () => {
  const pause = setup(), esc = setup();
  pause.preview.pause(); esc.preview.escape();
  pause.advance(999);
  assert.equal(pause.fold.animations.length, 0);
  pause.advance(1);
  assert.deepEqual(pause.fold.animations[0].frames, esc.fold.animations[0].frames);
  assert.deepEqual(pause.fold.animations[0].options, esc.fold.animations[0].options);
  assert.deepEqual(pause.connection.animations[0].options, esc.connection.animations[0].options);
  for (const progress of [0, .2, .5, .9, 1]) { pause.sample(progress); esc.sample(progress); }
  assert.deepEqual(pause.fold.poses, esc.fold.poses);
  assert.ok(esc.fold.poses.every((degrees, i, poses) => i === 0 || degrees <= poses[i - 1]), 'return must move continuously toward the connected pose');
  assert.equal(esc.fold.poses.at(-1), 0);
  for (const frame of esc.fold.animations[0].frames) assert.ok(!('opacity' in frame), 'screen must move, not crossfade');
});

test('glow reaches its peak at the same time the screen reaches its connected pose', async () => {
  const h = setup(); h.preview.escape();
  const screen = h.fold.animations[0], glow = h.connection.animations[0];
  assert.equal(glow.options.delay + glow.frames[1].offset * glow.options.duration, screen.options.duration);
  assert.equal(glow.frames.at(-1).opacity, 0);
  await h.finishReturn();
  assert.equal(h.fold.poses.at(-1), 0);
  assert.equal(h.drawFrames.size, 0);
  assert.equal(h.phases.at(-1), 'returned');
});

test('Esc interrupts the pause without leaving a second scheduled return', () => {
  const h = setup(); h.preview.pause(); h.advance(400); h.preview.escape(); h.advance(1000);
  assert.equal(h.fold.animations.length, 1);
  assert.equal(h.connection.animations.length, 1);
});

test('replay eases from the connected pose instead of snapping to the folded pose', async () => {
  const h = setup(); h.preview.escape(); h.preview.escape(); h.preview.pause();
  assert.equal(h.fold.animations.length, 1);
  await h.finishReturn();
  const connected = h.fold.poses.at(-1);
  h.preview.escape();
  assert.equal(h.phases.at(-1), 'preparing');
  assert.equal(h.fold.poses.at(-1), connected);
  h.sample(.5);
  assert.ok(h.fold.poses.at(-1) > connected && h.fold.poses.at(-1) < h.fold.poses[0]);
  assert.equal(h.connection.animations[0].cancelled, true);
  await h.finishReturn();
  assert.equal(h.phases.at(-1), 'returning');
  assert.equal(h.fold.animations.length, 3);
});

test('Escape during replay preparation skips the hold without interrupting movement', async () => {
  const h = setup(); h.preview.escape(); await h.finishReturn();
  h.preview.pause(); h.preview.escape(); h.preview.escape();
  assert.equal(h.fold.animations.length, 2);
  await h.finishReturn();
  assert.equal(h.phases.at(-1), 'returning');
  h.advance(1000);
  assert.equal(h.fold.animations.length, 3);
});

test('switching only sets the preference and disabling cancels a queued glow', async () => {
  const h = setup(); h.preview.setConnectionEnabled(false); h.preview.setConnectionEnabled(true);
  assert.equal(h.fold.animations.length + h.connection.animations.length, 0);
  h.preview.escape(); h.preview.setConnectionEnabled(false); await h.finishReturn();
  assert.equal(h.connection.animations[0].cancelled, true);
  h.preview.setConnectionEnabled(true);
  assert.equal(h.connection.animations.length, 1);
  h.preview.escape(); await h.finishReturn();
  assert.equal(h.connection.animations.length, 2);
});

test('reset and unmount cancel timers, animations and late preparation callbacks', async () => {
  const h = setup(); h.preview.pause(); h.preview.reset(); h.advance(1000);
  assert.equal(h.fold.animations.length, 0);
  h.preview.escape(); h.fold.animations[0].finish(); h.preview.reset(); await Promise.resolve();
  assert.ok(h.connection.animations.every(a => a.cancelled));
  assert.equal(h.phases.at(-1), 'folded');
  h.preview.escape(); await h.finishReturn(); h.preview.pause();
  h.fold.animations.at(-1).finish(); h.preview.dispose(); await Promise.resolve();
  assert.ok(h.fold.animations.every(a => a.cancelled));
  assert.ok(h.connection.animations.every(a => a.cancelled));
  assert.equal(h.fold.animations.length, 3);
  assert.equal(h.drawFrames.size, 0);
});

test('reduced motion returns immediately without glow and keeps the pause timing', () => {
  const h = setup(); h.reduce(); h.preview.pause(); h.advance(999);
  assert.equal(h.phases.at(-1), 'waiting');
  h.advance(1);
  assert.equal(h.phases.at(-1), 'returned');
  h.preview.escape();
  assert.equal(h.fold.poses.at(-1), 0);
  assert.equal(h.fold.animations.length + h.connection.animations.length, 0);
});

test('resize redraw preserves the current pose and disposed previews never draw again', () => {
  const h = setup(); h.preview.escape(); h.sample(.4);
  const pose = h.fold.poses.at(-1);
  h.preview.redraw();
  assert.equal(h.fold.poses.at(-1), pose);
  h.preview.dispose();
  const frames = h.fold.poses.length;
  h.preview.redraw();
  assert.equal(h.fold.poses.length, frames);
  assert.equal(h.drawFrames.size, 0);
});
