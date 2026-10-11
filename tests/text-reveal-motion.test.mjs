import test from 'node:test';
import assert from 'node:assert/strict';
import { createTextReveal, textLinePose } from '../src/home-next/textRevealMotion.ts';
import { scenePose, scrollCopyRevealTiming, timedCopyRevealTiming, subtitleRevealCue, scrollCopyProgress } from '../src/home-next/choreography.ts';
import { sceneProjection, lidClearProgress } from '../src/home-next/sceneProjection.ts';

test('copy keeps its reveal speeds, the subtitle lead and the timed hero reading cue', () => {
  assert.equal(timedCopyRevealTiming.headline, 1050);
  assert.equal(timedCopyRevealTiming.subtitle, 900);
  assert.equal(timedCopyRevealTiming.subtitleLag, 80);
  assert.equal(scrollCopyRevealTiming.headline.duration, .33);
  assert.equal(scrollCopyRevealTiming.headline.lead, 0);
  assert.equal(scrollCopyRevealTiming.headline.delayMultiplier, 1.02);
  assert.ok(Math.abs(scrollCopyRevealTiming.subtitle.delayMultiplier - 1.02 * 1.02) < 1e-8);
  assert.ok(Math.abs(scrollCopyRevealTiming.subtitle.lead - .572 * .05) < 1e-8);
  assert.equal(scrollCopyRevealTiming.subtitle.duration, .24);
  assert.ok(Math.abs(subtitleRevealCue(2) * timedCopyRevealTiming.headline - 122) < 1e-8);
});

test('each copy block follows its viewport-fitted lid clearance and reverses with scroll', () => {
  for (const [width, height] of [[1118, 1016], [1440, 900], [1280, 720], [1056, 600]]) {
    const openingHeight = Math.max(720, height);
    const subtitleTop = Math.max(112, Math.min(190, height * .15)) + 32 + 144 + 24;
    const modelTop = subtitleTop + 56 + 128;
    const bounds = sceneProjection(scenePose(1, width, height, openingHeight), width, height, openingHeight).bounds;
    const scale = Math.min(Math.min(1280, width - 128) / (bounds.right - bounds.left),
      Math.max(96, height - modelTop - 48) / (bounds.bottom - bounds.top));
    const shift = modelTop - bounds.top * scale;
    for (const [copy, copyTop] of [['headline', subtitleTop - 168], ['subtitle', subtitleTop]]) {
      const { lead, duration, delayMultiplier } = scrollCopyRevealTiming[copy];
      const clearance = lidClearProgress(width, height, openingHeight, scale, shift, copyTop);
      const start = (clearance - lead / .94) * delayMultiplier;
      const pose = scenePose(clearance, width, height, openingHeight);
      const lidTop = sceneProjection(pose, width, height, openingHeight).lidTop
        * (1 + (scale - 1) * pose.reveal) + shift * pose.reveal;
      assert.ok(Math.abs(lidTop - copyTop) < .001, 'the cue is determined by the visible lid edge');
      assert.equal(scrollCopyProgress(start - .001, clearance, copy), 0);
      assert.ok(scrollCopyProgress(start, clearance, copy) < 1e-8);
      assert.ok(Math.abs(scrollCopyProgress(start + duration * .5 / .94, clearance, copy) - .5) < 1e-8);
      assert.equal(scrollCopyProgress(1, clearance, copy), 1, 'the original span finishes within the scene');
      const progress = [0, start, start + .1, 1];
      const forward = progress.map(p => scrollCopyProgress(p, clearance, copy));
      assert.deepEqual([...progress].reverse().map(p => scrollCopyProgress(p, clearance, copy)), forward.reverse());
    }
  }
});

test('line entrances retain their poses, reverse with scroll and mirror panel direction', () => {
  for (const count of [1, 2]) for (let index = 0; index < count; index++) {
    assert.deepEqual(textLinePose(1, index, count), { opacity: 1, y: 0, tilt: -0, skew: 0, scale: 1 });
    assert.equal(textLinePose(0, index, count).opacity, 0);
    let previousY = 100;
    for (let step = 0; step <= 100; step++) {
      const progress = step / 100, pose = textLinePose(progress, index, count);
      const mirrored = textLinePose(progress, index, count, -1);
      assert.ok(pose.y <= previousY); previousY = pose.y;
      assert.equal(mirrored.y, -pose.y);
      assert.equal(mirrored.tilt, -pose.tilt);
      assert.equal(mirrored.skew, -pose.skew);
      assert.equal(mirrored.opacity, pose.opacity);
      assert.equal(mirrored.scale, pose.scale);
      if (progress >= .5) assert.equal(pose.opacity, 1);
      if (index) assert.ok(pose.y >= textLinePose(progress, index - 1, count).y);
    }
    const progress = [0, .2, .4, .6, .8, 1];
    assert.deepEqual([...progress].reverse().map(p => textLinePose(p, index, count)),
      progress.map(p => textLinePose(p, index, count)).reverse());
  }
});

test('changing direction invalidates a cached reveal and settling clears its transform', () => {
  const line = { style: { opacity: '', transform: '' } };
  const reveal = createTextReveal({ querySelectorAll: () => [line] });
  reveal(.25);
  const forward = line.style.transform;
  reveal(.25, -1);
  assert.notEqual(line.style.transform, forward);
  assert.match(line.style.transform, /translate3d\(0, -[\d.]+%, 0\)/);
  reveal(1, -1);
  assert.equal(line.style.opacity, '1');
  assert.equal(line.style.transform, 'none');
  line.style.opacity = ''; line.style.transform = '';
  reveal(1, -1);
  assert.equal(line.style.opacity, '1', 'a reduced-motion reset invalidates the cache');
});

test('a mixed-size message keeps equal pixel travel and staggered line unfolding', () => {
  const lines = Array.from({ length: 3 }, () => ({ style: { opacity: '', transform: '' } }));
  const reveal = createTextReveal({ querySelectorAll: () => lines }, { travelPx: 64 });
  for (const direction of [1, -1]) for (let step = 0; step < 100; step++) {
    reveal(step / 100, direction);
    const distances = lines.map(line => Number(line.style.transform.match(/translate3d\(0, (-?[\d.]+)px, 0\)/)?.[1] ?? 0));
    assert.ok(distances.every(distance => distance === distances[0]));
  }
  reveal(.2);
  assert.ok(Number(lines[0].style.opacity) > Number(lines[1].style.opacity));
  assert.ok(Number(lines[1].style.opacity) > Number(lines[2].style.opacity));
  assert.notEqual(lines[0].style.transform, lines[1].style.transform, '3D unfolding remains line-by-line');
  reveal(1);
  assert.ok(lines.every(line => line.style.transform === 'none' && line.style.opacity === '1'));
});
