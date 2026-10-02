import { useSyncExternalStore } from 'react';

const query = '(max-width: 768px)';
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const snapshot = () => window.matchMedia(query).matches;

// A real text space keeps mobile accessible names and wrapping intact;
// desktop retains the approved line break. No alternate copy is rendered.
export default function ResponsiveBreak() {
  const mobile = useSyncExternalStore(subscribe, snapshot, () => false);
  return mobile ? ' ' : <br />;
}
