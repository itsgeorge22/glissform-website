/** Consume a whole wheel burst, regardless of distance, speed or renewed pressure. */
export function createSettingsWheelGesture() {
  let lastTime = -Infinity, lastStrongTime = -Infinity, lastDirection = 0, lastMagnitude = 0;
  const reset = () => { lastTime = lastStrongTime = -Infinity; lastDirection = lastMagnitude = 0; };
  const read = (time: number, delta: number, readyForNext = false) => {
    if (!delta) return 0;
    const direction = Math.sign(delta);
    // Small residual momentum must not keep a deliberate new stroke locked out.
    // Strong input needs 120ms of quiet; tiny tails retain the longer guard.
    const magnitude = Math.abs(delta), strong = magnitude >= 4;
    const renewed = readyForNext && magnitude >= Math.max(6, lastMagnitude * 1.5);
    const fresh = !lastDirection || direction !== lastDirection || time - lastTime >= 280
      || (strong && time - lastStrongTime >= 120) || renewed;
    lastTime = time; lastDirection = direction; lastMagnitude = magnitude;
    if (strong) lastStrongTime = time;
    return fresh ? direction : 0;
  };
  return { read, reset };
}
