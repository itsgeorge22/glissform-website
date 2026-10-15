import { elementDesignScale } from './designScale.ts';
import { ease } from './choreography.ts';
import { springDisplacement } from './objectMotion.ts';
import { clickPressure, featureCursorArrival, featureCursorTravel, featureDemoEntrance, featureDemoPause, phase, pointOn, relativeOffset, runFeatureDemo, type Curve, type Point } from './featureDemoMotion.ts';

const timing = {
  enter: featureDemoEntrance, approach: featureCursorTravel, press: 1.76, release: 1.88,
  open: .16, hold: 1.4, close: .11, postClose: .2, exit: featureCursorTravel,
};
const closeRelease = timing.release + timing.open + timing.hold;
const closePress = closeRelease - (timing.release - timing.press);
const depart = closeRelease + timing.close + timing.postClose;
const cycle = depart + timing.exit + featureDemoPause - timing.enter;

export function easyToReachPose(seconds: number, reducedMotion = false) {
  const time = seconds % cycle;
  const opened = ease(phase(time, timing.release, timing.open));
  const closed = ease(phase(time, closeRelease, timing.close));
  const highlighted = ease(phase(time, timing.press, timing.release - timing.press));
  const press = reducedMotion ? 0 : Math.max(clickPressure(time, timing.press, timing.release), clickPressure(time, closePress, closeRelease));
  const settle = 1 - springDisplacement(phase(time, timing.release, .32), 8, 10);
  return {
    time,
    open: reducedMotion ? 1 : opened * (1 - closed),
    highlight: reducedMotion ? 1 : highlighted * (1 - closed),
    iconScale: 1 - .03 * press,
    menuScale: reducedMotion ? 1 : .975 + .025 * settle - .01 * closed,
    menuY: reducedMotion ? 0 : -6 * (1 - settle) - 3 * closed,
    press,
    cursorVisible: !reducedMotion && time >= timing.enter && time < depart + timing.exit,
  };
}

export function animateEasyToReach(root: HTMLElement) {
  const menuBar = root.querySelector<HTMLElement>('.feature-menu-bar')!;
  const icon = root.querySelector<HTMLElement>('.feature-menu-bar__app')!;
  const menu = root.querySelector<HTMLElement>('.easy-to-reach-visual__menu')!;
  const cursor = root.querySelector<HTMLElement>('.feature-cursor')!;
  let arrival: Curve, departure: Curve;
  let lastSeconds = 0, previousPoint: Point | undefined, offsetAt = 0;
  let offset: Point = { x: 0, y: 0 }, previousWidth = 0, previousHeight = 0;
  const cursorPoint = (time: number) => time < depart
    ? pointOn(arrival, phase(time, timing.enter, timing.approach))
    : pointOn(departure, phase(time, depart, timing.exit));
  const measure = () => {
    const { x, y } = relativeOffset(icon, root);
    const unit = parseFloat(getComputedStyle(root).fontSize) || 1;
    const width = root.clientWidth, height = root.clientHeight;
    const target = { x: x + icon.offsetWidth / 2, y: y + icon.offsetHeight / 2 };
    arrival = featureCursorArrival(width, height, unit, parseFloat(getComputedStyle(cursor).fontSize) || unit, target, elementDesignScale(root));
    // Bow right into the panel, then curve back left toward the icon.
    arrival[1] = { x: width * .7, y: height * .82 };
    arrival[2] = { x: target.x + 150 * unit, y: target.y + 130 * unit };
    departure = [target,
      { x: target.x + 90 * unit, y: target.y - 16 * unit },
      { x: width * .91, y: 20 * unit },
      { x: width + 36 * unit, y: -36 * unit },
    ];
    // A minute or date change can move the icon without resizing the panel.
    // Retarget the current gesture without restarting its clock or jumping the
    // cursor; the dropdown follows its icon parent directly in CSS.
    if (previousPoint && width === previousWidth && height === previousHeight && root.dataset.playing === 'true') {
      const nextPoint = cursorPoint(easyToReachPose(lastSeconds).time);
      offset = { x: previousPoint.x - nextPoint.x, y: previousPoint.y - nextPoint.y };
      offsetAt = lastSeconds;
    } else offset = { x: 0, y: 0 };
    previousWidth = width; previousHeight = height;
  };
  const draw = (seconds: number, reducedMotion: boolean) => {
    if (!arrival) return;
    const pose = easyToReachPose(seconds, reducedMotion);
    if (reducedMotion || seconds < lastSeconds || root.dataset.playing !== 'true') offset = { x: 0, y: 0 };
    const target = cursorPoint(pose.time);
    const remaining = 1 - ease(phase(seconds, offsetAt, .18));
    const point = { x: target.x + offset.x * remaining, y: target.y + offset.y * remaining };
    lastSeconds = seconds; previousPoint = point;
    root.style.setProperty('--menu-open', String(pose.open));
    root.style.setProperty('--menu-highlight', String(pose.highlight));
    root.style.setProperty('--menu-icon-scale', String(pose.iconScale));
    root.style.setProperty('--menu-scale', String(pose.menuScale));
    root.style.setProperty('--menu-y', `${pose.menuY}em`);
    menu.style.visibility = pose.open <= .001 ? 'hidden' : 'visible';
    cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${1 - pose.press * .14})`;
    cursor.style.opacity = pose.cursorVisible ? '1' : '0';
  };
  return runFeatureDemo(root, { measure, draw, resizeTargets: [menuBar], cleanup: () => {
    root.style.removeProperty('--menu-open'); root.style.removeProperty('--menu-scale'); root.style.removeProperty('--menu-y');
    root.style.removeProperty('--menu-highlight'); root.style.removeProperty('--menu-icon-scale');
    menu.style.removeProperty('visibility');
    cursor.style.removeProperty('transform'); cursor.style.removeProperty('opacity');
  } });
}
