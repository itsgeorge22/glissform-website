/** A small shared handoff between the independently hydrated hero and features. */
export type FeatureEntry = { linked: boolean; ready: boolean; coverage: number; returning?: boolean };
let entry: FeatureEntry = { linked: false, ready: false, coverage: 0 };
const listeners = new Set<(value: FeatureEntry) => void>();

export function setFeatureEntry(value: FeatureEntry) {
  // The shared scroll endpoint is authoritative. Floating-point residue must
  // not keep the copy in its return reveal after feature navigation starts.
  if (value.ready) value = { ...value, coverage: 1, returning: false };
  if (entry.linked === value.linked && entry.ready === value.ready && entry.coverage === value.coverage
    && entry.returning === value.returning) return;
  entry = value;
  for (const listener of listeners) listener(entry);
}

export function subscribeFeatureEntry(listener: (value: FeatureEntry) => void) {
  listeners.add(listener);
  listener(entry);
  return () => { listeners.delete(listener); };
}
