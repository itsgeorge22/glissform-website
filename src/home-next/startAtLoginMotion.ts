import { ease } from './choreography.ts';
import { springDisplacement } from './objectMotion.ts';
import { clickPressure, featureCursorArrival, featureCursorTravel, featureDemoEntrance, featureDemoPause, phase, pointOn, relativeOffset, runFeatureDemo, type Curve } from './featureDemoMotion.ts';

const timing = {
  enter: featureDemoEntrance, approach: featureCursorTravel, focusPress: 1.76, focusRelease: 1.88,
  typing: 1.96, typeDuration: .4, transfer: 2.44, transferDuration: .22,
  submitPress: 2.84, submitRelease: 2.96, unlock: .2, zoom: .65, launchPause: .12, launch: .42,
  exit: featureCursorTravel, resetHold: 1.6,
};
const zoomAt = timing.submitRelease + timing.unlock;
const zoomEnd = zoomAt + timing.zoom;
const launchAt = zoomEnd + timing.launchPause;
const exitEnd = timing.submitRelease + timing.exit;
const resetAt = exitEnd + timing.resetHold;
// The reverse zoom lands at the loop boundary. Restore the clock and field
// during the next lead-in. A longer ready hold extends this demo’s repeat gap
// without cutting off the reverse zoom or shortening the shared minimum pause.
const cycle = Math.max(exitEnd + featureDemoPause - timing.enter, resetAt + timing.zoom);
const initialScale = 1337.732 / 2364;
const blend = (from: number, to: number, progress: number) => from + (to - from) * progress;

export function startAtLoginPose(seconds: number, reducedMotion = false) {
  const time = seconds % cycle;
  const returning = time >= resetAt;
  const desktop = reducedMotion ? 1 : ease(phase(time, timing.submitRelease, timing.unlock));
  // Show the opening composition immediately; only a completed loop fades it
  // back in after the reverse zoom.
  const reveal = seconds < cycle ? 1 : ease(phase(time, 0, timing.unlock));
  const login = reducedMotion ? 0 : reveal * (1 - desktop);
  const zoom = reducedMotion ? 1 : returning
    ? 1 - ease(phase(time, resetAt, timing.zoom)) : ease(phase(time, zoomAt, timing.zoom));
  const launch = phase(time, launchAt, timing.launch);
  const settle = 1 - springDisplacement(launch, 4.5, 10);
  const focus = reducedMotion || returning ? 0 : ease(phase(time, timing.focusPress, timing.focusRelease - timing.focusPress));
  const dots = returning || reducedMotion ? 0 : Math.floor(6 * phase(time, timing.typing, timing.typeDuration));
  const focusPress = clickPressure(time, timing.focusPress, timing.focusRelease);
  const submitPress = reducedMotion ? 0 : clickPressure(time, timing.submitPress, timing.submitRelease);
  const stage = reducedMotion ? 'ready' : returning ? 'returning'
    : time >= launchAt ? 'ready' : time >= zoomEnd ? 'launch-pause' : time >= zoomAt ? 'zooming'
    : time >= timing.submitRelease ? 'unlocking' : time >= timing.transfer ? 'submit'
    : time >= timing.typing ? 'typing' : 'sign-in';
  return {
    time, desktop, login, zoom, focus, dots, submitPress, stage,
    // Keep the app and its menu bar opaque throughout the return. They move
    // beyond the crop before their next launch is reset at the loop boundary.
    launched: reducedMotion ? 1 : ease(phase(time, launchAt, .18)),
    iconScale: reducedMotion ? 1 : .8 + .2 * settle,
    iconY: reducedMotion ? 0 : 4 * (1 - settle),
    press: reducedMotion ? 0 : Math.max(focusPress, submitPress),
    cursorVisible: !reducedMotion && time >= timing.enter && time < exitEnd,
  };
}

/** Interpolate the two Figma crops inside the unchanged feature container. */
export function startAtLoginCamera(width: number, height: number, zoom: number) {
  const startY = (height - 854) / 2 + 120;
  // Taller desktop previews still crop through the screen, as in the reference.
  const fittedScale = Math.max(initialScale, (height - startY) / 1530);
  return {
    x: blend((width - 2364 * fittedScale) / 2, width - 80 - 2364, zoom),
    y: blend(startY, (height - 696) / 2 + 120, zoom),
    scale: blend(fittedScale, 1, zoom),
  };
}

export function animateStartAtLogin(root: HTMLElement) {
  const screen = root.querySelector<HTMLElement>('.start-at-login-visual__screen')!;
  const field = root.querySelector<HTMLElement>('.start-at-login-visual__password')!;
  const submit = root.querySelector<HTMLElement>('.start-at-login-visual__submit')!;
  const cursor = root.querySelector<HTMLElement>('.feature-cursor')!;
  let arrival: Curve, transfer: Curve, departure: Curve;
  let unit = 1, width = 696, height = 854;
  const measure = () => {
    unit = parseFloat(getComputedStyle(root).fontSize) || 1;
    width = root.clientWidth / unit; height = root.clientHeight / unit;
    const camera = startAtLoginCamera(width, height, 0);
    const fit = camera.scale / initialScale;
    // Anchor credentials outside the camera so the field keeps a real 60px
    // bottom gap. Match its original fitted size and measure both click targets
    // again whenever the outer container changes size.
    root.style.setProperty('--login-credentials-unit', `${unit * fit}px`);
    const fieldOffset = relativeOffset(field, root), arrowOffset = relativeOffset(submit, root);
    const target = { x: fieldOffset.x + field.offsetWidth * .55,
      y: fieldOffset.y + field.offsetHeight / 2 };
    const arrow = { x: arrowOffset.x + submit.offsetWidth / 2,
      y: arrowOffset.y + submit.offsetHeight / 2 };
    arrival = featureCursorArrival(root.clientWidth, root.clientHeight, unit, parseFloat(getComputedStyle(cursor).fontSize) || unit, target);
    transfer = [target, { x: target.x + 18 * unit, y: target.y - 6 * unit },
      { x: arrow.x - 18 * unit, y: arrow.y - 6 * unit }, arrow];
    departure = [arrow,
      { x: arrow.x + 90 * unit, y: arrow.y - 16 * unit },
      { x: root.clientWidth * .91, y: 20 * unit },
      { x: root.clientWidth + 36 * unit, y: -36 * unit },
    ];
  };
  const draw = (seconds: number, reducedMotion: boolean) => {
    if (!arrival) return;
    const pose = startAtLoginPose(seconds, reducedMotion);
    const camera = startAtLoginCamera(width, height, pose.zoom);
    const point = pose.time < timing.transfer
      ? pointOn(arrival, phase(pose.time, timing.enter, timing.approach))
      : pose.time < timing.submitRelease
        ? pointOn(transfer, phase(pose.time, timing.transfer, timing.transferDuration))
        : pointOn(departure, phase(pose.time, timing.submitRelease, timing.exit));
    screen.style.transform = `translate3d(${camera.x * unit}px, ${camera.y * unit}px, 0) scale(${camera.scale})`;
    const properties = {
      '--login-desktop': pose.desktop,
      '--login-opacity': pose.login,
      '--login-focus': pose.focus,
      '--login-dot-clip': `${pose.dots ? Math.max(0, 53.3333 - (pose.dots * 9.33333 - 2.66666)) : 53.3333}em`,
      '--login-caret': pose.dots === 0 ? pose.focus : 0,
      '--login-submit-scale': 1 - .08 * pose.submitPress,
      '--login-base-magnification': 1 / initialScale,
      '--login-bezel': `${15 / camera.scale}em`,
      '--login-corner': `${blend(11.176, 24, pose.zoom) / camera.scale}em`,
      '--login-bar-scale': blend((22.352 / 48) / initialScale, 1, pose.zoom),
      '--login-bar-inset': `${blend(9.31 / initialScale, 20, pose.zoom)}em`,
      '--menu-app-opacity': pose.launched,
      '--menu-icon-scale': pose.iconScale,
      '--menu-app-y': `${pose.iconY}em`,
    };
    for (const [property, value] of Object.entries(properties)) root.style.setProperty(property, String(value));
    if (root.dataset.loginStage !== pose.stage) root.dataset.loginStage = pose.stage;
    cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${1 - pose.press * .14})`;
    cursor.style.opacity = pose.cursorVisible ? '1' : '0';
  };
  return runFeatureDemo(root, { measure, draw, cleanup: () => {
    for (const property of Array.from(root.style)) {
      if (property.startsWith('--login-') || ['--menu-app-opacity', '--menu-icon-scale', '--menu-app-y'].includes(property)) root.style.removeProperty(property);
    }
    delete root.dataset.loginStage;
    screen.style.removeProperty('transform');
    cursor.style.removeProperty('transform'); cursor.style.removeProperty('opacity');
  } });
}
