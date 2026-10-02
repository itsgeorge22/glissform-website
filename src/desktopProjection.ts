/** Screen-local projection shared with the native app and the hero wallpaper. */
export function desktopProjection(foldDegrees: number) {
  const degrees = Number.isFinite(foldDegrees) ? Math.max(0, Math.min(130, foldDegrees)) : 0;
  const radians = degrees * Math.PI / 180;
  const imageAngle = .22 * radians + .78 * radians / (1 + (degrees / 34) ** 4) ** .25;
  return {
    radians,
    sine: Math.sin(imageAngle),
    cosine: Math.cos(imageAngle),
    topWidth: 1 - .58 * degrees / 130,
    progress: Math.min(1, degrees / 86),
  };
}

/** The hero's progressive frost and shadow, in source-image pixels. */
export function desktopShading(foldDegrees: number, imageHeight: number) {
  const { progress } = desktopProjection(foldDegrees);
  const degrees = Number.isFinite(foldDegrees) ? Math.max(0, Math.min(130, foldDegrees)) : 0;
  const ramp = Math.min(1, progress / .75);
  const strength = .65 * (.6 + .4 * ramp * ramp * (3 - 2 * ramp));
  return {
    frost: progress ** .7 * imageHeight * strength,
    broadShadow: progress ** 2.2,
    contactShadow: .88 * (1 - Math.exp(-degrees / 3)),
    contactWidth: .035 + .2 * (1 - Math.exp(-degrees / 22)),
  };
}
