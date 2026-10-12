import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocalClock, getLocalClockSnapshot, subscribeLocalClock } from '../src/home-next/localClock.ts';

test('clock formatting handles hour, AM/PM and date changes using local device time', () => {
  const at = (day, hour, minute, locale = 'en-US') => formatLocalClock(new Date(2026, 9, day, hour, minute), locale);
  assert.equal(at(12, 9, 59).time, '9:59 AM');
  assert.equal(at(12, 10, 0).time, '10:00 AM');
  assert.equal(at(12, 12, 0).time, '12:00 PM');
  assert.equal(at(13, 0, 0).time, '12:00 AM');
  assert.equal(at(13, 0, 0).lockTime, '12:00');
  assert.notEqual(at(12, 23, 59).date, at(13, 0, 0).date);
  assert.notEqual(at(12, 9, 59, 'en-US').date, at(12, 9, 59, 'de-DE').date);
});

test('subscribers share one minute-aligned timer, refresh after hiding, and clean up', () => {
  const events = () => ({ listeners: new Map(),
    addEventListener(key, fn) { this.listeners.set(key, fn); },
    removeEventListener(key) { this.listeners.delete(key); },
    emit(key) { this.listeners.get(key)?.(); } });
  const RealDate = Date, timers = new Map();
  let now = new RealDate(2026, 9, 12, 23, 59, 45).getTime(), nextId = 0, first = 0, second = 0;
  const window = { ...events(), setTimeout(fn, delay) { timers.set(++nextId, { fn, delay }); return nextId; },
    clearTimeout(id) { timers.delete(id); } };
  const document = { ...events(), hidden: false };
  const globals = { window, document, navigator: { language: 'en-US' },
    Date: class extends RealDate { constructor(...args) { super(...(args.length ? args : [now])); } } };
  const originals = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true });
  let stopFirst, stopSecond;
  try {
    stopFirst = subscribeLocalClock(() => first++);
    stopSecond = subscribeLocalClock(() => second++);
    assert.equal(timers.size, 1);
    const pending = [...timers.values()][0];
    assert.equal(pending.delay, 15_000);
    const before = getLocalClockSnapshot();
    now += pending.delay; pending.fn();
    assert.equal(getLocalClockSnapshot().time, '12:00 AM');
    assert.notEqual(getLocalClockSnapshot().date, before.date);
    assert.equal(first, 2); assert.equal(second, 1); assert.equal(timers.size, 1);
    assert.equal([...timers.values()][0].delay, 60_000);
    document.hidden = true; document.emit('visibilitychange');
    assert.equal(timers.size, 0);
    now += 3_600_000;
    document.hidden = false; document.emit('visibilitychange');
    assert.equal(getLocalClockSnapshot().time, '1:00 AM');
    now += 3_600_000; window.emit('focus');
    assert.equal(getLocalClockSnapshot().time, '2:00 AM');
    assert.equal(timers.size, 1);
    stopFirst(); stopFirst = undefined; assert.equal(timers.size, 1);
    stopSecond(); stopSecond = undefined;
    assert.equal(timers.size, 0); assert.equal(getLocalClockSnapshot(), null);
    assert.equal(window.listeners.size, 0); assert.equal(document.listeners.size, 0);
  } finally {
    stopFirst?.(); stopSecond?.();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
