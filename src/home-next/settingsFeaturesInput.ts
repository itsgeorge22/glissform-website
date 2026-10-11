/** Recognize fresh wheel intent without treating a decaying momentum tail as another swipe. */
export function createSettingsWheelGesture() {
  let lastTime = -Infinity, lastDirection = 0, lastMagnitude = 0;
  let started = -Infinity, peak = 0, trough = Infinity, risingSamples = 0;
  const reset = () => {
    lastTime = started = -Infinity;
    lastDirection = lastMagnitude = peak = risingSamples = 0;
    trough = Infinity;
  };
  const read = (time: number, delta: number) => {
    if (!delta) return 0;
    const direction = Math.sign(delta), magnitude = Math.abs(delta);
    const gap = time - lastTime;
    // A short pause can separate deliberate strokes. Tiny residual events
    // need a longer pause so a sparse momentum tail cannot advance again.
    let fresh = !lastDirection || direction !== lastDirection
      || gap >= 280 || (gap >= 120 && magnitude >= 4);
    if (!fresh) {
      // New trackpad contact can arrive before the old momentum stops.
      // Require a substantial slowdown followed by two stronger samples.
      if (magnitude < peak * .5) trough = Math.min(trough, magnitude);
      const renewed = time - started >= 120 && magnitude >= Math.max(6, trough * 2)
        && magnitude >= lastMagnitude * .8;
      risingSamples = renewed ? risingSamples + 1 : 0;
      fresh = risingSamples >= 2;
    }
    lastTime = time; lastDirection = direction; lastMagnitude = magnitude;
    if (fresh) {
      started = time; peak = magnitude; trough = Infinity; risingSamples = 0;
    } else peak = Math.max(peak, magnitude);
    return fresh ? direction : 0;
  };
  return { read, reset };
}
