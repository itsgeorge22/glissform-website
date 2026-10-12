import { useSyncExternalStore } from 'react';

/** Preserve the hero's localized date and 12-hour time on every clock surface. */
export function formatLocalClock(now: Date, language: string) {
  const date = new Intl.DateTimeFormat(language, {
    weekday: 'short', month: 'short', day: 'numeric',
  }).formatToParts(now).map(part => part.type === 'day' ? `${part.value}.` : part.value).join('');
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const timeParts = formatter.formatToParts(now);
  return {
    date,
    time: formatter.format(now),
    lockTime: timeParts.filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim(),
    dateTime: now.toISOString(),
  };
}

let snapshot: ReturnType<typeof formatLocalClock> | null = null;
let timer = 0;
const listeners = new Set<() => void>();
export const getLocalClockSnapshot = () => snapshot;
const serverSnapshot = () => null;

function refresh() {
  window.clearTimeout(timer);
  if (document.hidden) return;
  const now = new Date();
  snapshot = formatLocalClock(now, navigator.language);
  for (const listener of listeners) listener();
  timer = window.setTimeout(refresh, 60_000 - now.getTime() % 60_000);
}

export function subscribeLocalClock(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    refresh();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', refresh);
    window.removeEventListener('focus', refresh);
    snapshot = null;
  };
}

/** One minute-aligned device clock, shared across the hero and feature islands. */
export function useLocalClock() {
  return useSyncExternalStore(subscribeLocalClock, getLocalClockSnapshot, serverSnapshot);
}
