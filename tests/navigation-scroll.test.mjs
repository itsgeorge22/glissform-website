import test from 'node:test';
import assert from 'node:assert/strict';
import { nextNavigationScrollState, nextNavigationScrollPosition } from '../src/home-next/navigationScroll.ts';

const initial = () => ({ hidden: false, direction: 0, distance: 0 });

test('navigation hides after 80px down and returns after 40px up', () => {
  let state = initial();
  for (let pixel = 1; pixel <= 79; pixel++) {
    state = nextNavigationScrollState(state, 1);
    assert.equal(state.hidden, false);
  }
  state = nextNavigationScrollState(state, 1);
  assert.equal(state.hidden, true);
  for (let pixel = 1; pixel <= 39; pixel++) {
    state = nextNavigationScrollState(state, -1);
    assert.equal(state.hidden, true);
  }
  assert.equal(nextNavigationScrollState(state, -1).hidden, false);
});

test('a reversal measures a new direction without reusing the previous distance', () => {
  let state = nextNavigationScrollState(initial(), 30);
  state = nextNavigationScrollState(state, -10);
  state = nextNavigationScrollState(state, 79);
  assert.equal(state.hidden, false);
  state = nextNavigationScrollState(state, 1);
  assert.equal(state.hidden, true);
  state = nextNavigationScrollState(state, -39);
  state = nextNavigationScrollState(state, 10);
  state = nextNavigationScrollState(state, -39);
  assert.equal(state.hidden, true);
  assert.equal(nextNavigationScrollState(state, -1).hidden, false);
});

test('returning before the release always shows navigation and starts a fresh measurement', () => {
  const hidden = nextNavigationScrollState(initial(), 1000);
  assert.equal(hidden.hidden, true);
  const top = nextNavigationScrollState(hidden, -1, true);
  assert.deepEqual(top, initial());
  assert.equal(nextNavigationScrollState(top, 79).hidden, false);
  assert.equal(nextNavigationScrollState(top, 80).hidden, true);
});

test('the scene never spends the 80px hide allowance before its release', () => {
  const release = 2292;
  let state = initial();
  state = nextNavigationScrollPosition(state, 0, release - 1, release);
  assert.deepEqual(state, initial());
  state = nextNavigationScrollPosition(state, release - 1, release + 79, release);
  assert.equal(state.hidden, false);
  assert.equal(state.distance, 79);
  state = nextNavigationScrollPosition(state, release + 79, release + 80, release);
  assert.equal(state.hidden, true);
  state = nextNavigationScrollPosition(state, release + 80, release + 41, release);
  assert.equal(state.hidden, true);
  assert.deepEqual(nextNavigationScrollPosition(state, release + 41, release, release), initial());
  assert.equal(nextNavigationScrollPosition(initial(), 0, release + 80, release).hidden, true);
});
