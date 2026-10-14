import { featureDemoPause, runFeatureDemo, type FeatureDemo } from './featureDemoMotion.ts';

/** All six visuals share a section-wide cycle, independent of grid rows. */
export function runSeamlessFeatureDemo(root: HTMLElement, demo: FeatureDemo, range: { start: number; finish: number }) {
  return runFeatureDemo(root, demo, {
    group: root.closest<HTMLElement>('.seamless-close-features') ?? root,
    ...range,
    rest: featureDemoPause,
  });
}
