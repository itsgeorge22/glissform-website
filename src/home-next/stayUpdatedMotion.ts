import { elementDesignScale } from './designScale.ts';
import { ease } from './choreography.ts';
import { springDisplacement } from './objectMotion.ts';
import { clickPressure, featureCursorArrival, featureCursorTravel, featureDemoEntrance, featureDemoPause, phase, pointOn, relativeOffset, runFeatureDemo, type Curve } from './featureDemoMotion.ts';
import { updateLoaderPath, updateCheckRoute } from './stayUpdatedIcon.ts';
import { updateConfetti, updateConfettiDuration, updateConfettiPose } from './stayUpdatedConfetti.ts';

export const stayUpdatedTiming = {
  enter: featureDemoEntrance, approach: featureCursorTravel, press: 1.76, release: 1.88,
  change: .26, depart: 2.08, exit: featureCursorTravel, progress: 3,
  arrowPull: .15, arrowDive: .18, loaderCurl: .3, loaderRecoil: .16,
  checkDraw: .42,
  takeoff: .18, landing: .48, fold: .4, reopen: .4,
};
const timing = stayUpdatedTiming;
const progressAt = timing.release + timing.change;
const completeAt = progressAt + timing.progress;
const diveAt = timing.release + timing.arrowPull;
const curlAt = diveAt + timing.arrowDive * .65;
const spinAt = curlAt + timing.loaderRecoil;
const confettiEndAt = completeAt + updateConfettiDuration;
const foldAt = confettiEndAt - timing.fold - timing.reopen;
const resetAt = foldAt + timing.fold;
const reopenedAt = resetAt + timing.reopen;
// Finish reopening with the final particle, then keep the shared repeat pause.
const cycle = confettiEndAt + featureDemoPause - timing.enter;

export function stayUpdatedPose(seconds: number, reducedMotion = false) {
  const time = reducedMotion ? 0 : seconds % cycle;
  const folding = time >= foldAt && time < resetAt;
  const reopening = time >= resetAt && time < reopenedAt;
  const fold = folding ? 1 - ease(phase(time, foldAt, timing.fold))
    : reopening ? 1 - springDisplacement(phase(time, resetAt, timing.reopen), 7, 5.6) : 1;
  const updating = time >= timing.release && time < resetAt;
  const completed = updating && time >= completeAt;
  const change = updating ? ease(phase(time, timing.release, timing.change)) : 0;
  const done = completed ? ease(phase(time, completeAt, timing.change)) : 0;
  const progress = updating ? phase(time, progressAt, timing.progress) ** 2 : 0;
  const launch = phase(time, completeAt, timing.takeoff);
  const jump = !completed ? 0 : time < completeAt + timing.takeoff ? ease(launch)
    : springDisplacement(phase(time, completeAt + timing.takeoff, timing.landing), 6, 9);
  // Anticipate upward, then accelerate into the shelf while compressing from
  // the arrow's tip. Its impact curls and winds the shelf back before launch.
  const pull = updating ? ease(phase(time, timing.release, timing.arrowPull)) : 0;
  const dive = updating ? phase(time, diveAt, timing.arrowDive) : 0;
  const morph = updating ? ease(phase(time, curlAt, timing.loaderCurl)) : 0;
  const weight = updating ? 1 - springDisplacement(phase(time, curlAt, .42), 7, 10) : 0;
  const recoil = updating ? ease(phase(time, curlAt, timing.loaderRecoil)) : 0;
  const spinTime = Math.max(0, Math.min(time, completeAt) - spinAt);
  const spinDuration = completeAt - spinAt, ramp = .14;
  const accelerate = (t: number) => t <= 0 ? 0 : t < ramp ? t * t / (2 * ramp) : t - ramp / 2;
  const turns = (accelerate(spinTime) - accelerate(spinTime - spinDuration + ramp)) / 1.05;
  const launchTurn = ease(phase(spinTime, 0, .3)) * 48;
  return {
    time, change, progress, morph, fold,
    check: completed ? ease(phase(time, completeAt, timing.checkDraw)) : 0,
    loaderWidth: 3.21285 + 1.08715 * weight,
    confettiTime: time >= completeAt && time < confettiEndAt ? time - completeAt : -1,
    label: change + done,
    press: clickPressure(time, timing.press, timing.release),
    cardScale: 1 + jump * .03,
    cardY: -5 * jump,
    arrowY: -3.3 * pull + 27.3 * dive ** 2.5,
    arrowScaleY: 1 - .38 * ease(dive),
    spinnerAngle: updating ? -24 * recoil + turns * 360 + launchTurn : 0,
    secondsLeft: updating ? Math.max(0, Math.ceil(timing.progress - Math.max(0, time - progressAt))) : timing.progress,
    stage: folding ? 'folding' : reopening ? 'reopening' : completed ? 'done' : updating ? 'updating' : time >= resetAt ? 'waiting' : 'ready',
    cursorVisible: !reducedMotion && time >= timing.enter && time < timing.depart + timing.exit,
    updating,
  };
}

export function animateStayUpdated(root: HTMLElement) {
  const card = root.querySelector<HTMLElement>('.stay-updated-visual__card')!;
  const button = root.querySelector<HTMLElement>('.stay-updated-visual__button')!;
  const cursor = root.querySelector<HTMLElement>('.feature-cursor')!;
  const countdown = root.querySelector<HTMLElement>('[data-update-countdown]')!;
  const arrow = root.querySelector<SVGPathElement>('[data-update-arrow]')!;
  const shelf = root.querySelector<SVGPathElement>('[data-update-shelf]')!;
  const loader = root.querySelector<SVGPathElement>('[data-update-loader]')!;
  const spinner = root.querySelector<SVGGElement>('[data-update-spinner]')!;
  const confetti = Array.from(root.querySelectorAll<HTMLElement>('.stay-updated-visual__confetti i'));
  let arrival: Curve, departure: Curve, previousMorph = -1, previousCheck = -1, previousCount = -1;
  let arcLength = 0, routeLength = 0, checkLength = 0;
  let buttonBounds = { left: 0, top: 0, right: 0, bottom: 0 };
  let cardX = 0, cardY = 0, cardHeight = 0, confettiFadeRoom = 0, confettiVisible = false;
  const measure = () => {
    const { x, y } = relativeOffset(button, root);
    buttonBounds = { left: x, top: y, right: x + button.offsetWidth, bottom: y + button.offsetHeight };
    const unit = parseFloat(getComputedStyle(root).fontSize) || 1;
    const width = root.clientWidth, height = root.clientHeight;
    const origin = relativeOffset(card, root);
    cardX = (origin.x + card.offsetWidth / 2) / unit;
    cardY = origin.y / unit;
    cardHeight = card.offsetHeight / unit;
    confettiFadeRoom = height / unit - cardY - cardHeight - 18;
    const target = { x: x + button.offsetWidth * .64, y: y + button.offsetHeight * .54 };
    arrival = featureCursorArrival(width, height, unit, parseFloat(getComputedStyle(cursor).fontSize) || unit, target, elementDesignScale(root));
    departure = [target, { x: target.x + 90 * unit, y: target.y - 16 * unit },
      { x: width * .91, y: 20 * unit }, { x: width + 36 * unit, y: -36 * unit }];
  };
  const draw = (seconds: number, reducedMotion: boolean) => {
    if (!arrival) return;
    const pose = stayUpdatedPose(seconds, reducedMotion);
    const point = pose.time < timing.depart
      ? pointOn(arrival, phase(pose.time, timing.enter, timing.approach))
      : pointOn(departure, phase(pose.time, timing.depart, timing.exit));
    const hovered = pose.cursorVisible && point.x >= buttonBounds.left && point.x <= buttonBounds.right
      && point.y >= buttonBounds.top && point.y <= buttonBounds.bottom;
    const color = [52 * pose.change, 122 + 77 * pose.change, 255 - 166 * pose.change].map(v => v.toFixed(3)).join(' ');
    const properties = {
      '--update-change': pose.change, '--update-fill': `${pose.progress * 100}%`,
      '--update-label': pose.label, '--update-color': color, '--update-fold': pose.fold,
      '--update-button-scale': 1 - .035 * pose.press,
      '--update-blue-brightness': hovered ? .9 : 1,
      '--update-card-scale': pose.cardScale, '--update-card-y': `${pose.cardY}em`,
    };
    for (const [name, value] of Object.entries(properties)) root.style.setProperty(name, String(value));
    if (root.dataset.updateStage !== pose.stage) root.dataset.updateStage = pose.stage;
    if (previousCount !== pose.secondsLeft) {
      countdown.textContent = `${pose.secondsLeft} second${pose.secondsLeft === 1 ? '' : 's'} left...`;
      previousCount = pose.secondsLeft;
    }
    if (pose.check > 0) {
      if (previousCheck <= 0) {
        // Start with exactly the visible arc, including after a skipped frame.
        loader.setAttribute('d', updateLoaderPath(1));
        arcLength = loader.getTotalLength();
        const route = updateCheckRoute(pose.spinnerAngle);
        loader.setAttribute('d', route.path);
        routeLength = loader.getTotalLength();
        checkLength = route.checkLength;
      }
      // Feed the stroke into the nearby right tip, down the long arm and up
      // the short left arm, with its tail following the same track.
      const start = (routeLength - checkLength) * pose.check;
      const length = arcLength + (checkLength - arcLength) * pose.check;
      loader.setAttribute('stroke-dasharray', `${length} ${routeLength + 1}`);
      loader.setAttribute('stroke-dashoffset', String(-start));
    } else if (previousMorph !== pose.morph || previousCheck > 0) {
      loader.setAttribute('d', updateLoaderPath(pose.morph));
      loader.removeAttribute('stroke-dasharray');
      loader.removeAttribute('stroke-dashoffset');
    }
    previousMorph = pose.morph; previousCheck = pose.check;
    loader.setAttribute('stroke-width', String(pose.loaderWidth));
    arrow.setAttribute('transform', `translate(0 ${25.2675 + pose.arrowY}) scale(1 ${pose.arrowScaleY}) translate(0 -25.2675)`);
    shelf.style.opacity = pose.updating ? '0' : '1';
    spinner.style.opacity = pose.updating ? '1' : '0';
    spinner.setAttribute('transform', `rotate(${pose.spinnerAngle} 19.2771 19.2771)`);
    cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${1 - pose.press * .14})`;
    cursor.style.opacity = pose.cursorVisible ? '1' : '0';
    if (pose.confettiTime >= 0) {
      confetti.forEach((node, index) => {
        const piece = updateConfettiPose(updateConfetti[index], pose.confettiTime, cardHeight, confettiFadeRoom);
        node.style.transform = `translate3d(${cardX + piece.x}em, ${cardY + piece.y}em, 0) rotate(${piece.rotation}deg) rotateY(${piece.flip}deg)`;
        node.style.opacity = String(piece.opacity);
        node.style.zIndex = piece.front ? '2' : '0';
      });
      confettiVisible = true;
    } else if (confettiVisible) {
      confetti.forEach(node => { node.style.opacity = '0'; });
      confettiVisible = false;
    }
  };
  return runFeatureDemo(root, { measure, draw, cleanup: () => {
    for (const property of Array.from(root.style)) if (property.startsWith('--update-')) root.style.removeProperty(property);
    delete root.dataset.updateStage;
    countdown.textContent = `${timing.progress} seconds left...`;
    arrow.removeAttribute('transform'); shelf.style.removeProperty('opacity');
    spinner.style.removeProperty('opacity'); spinner.removeAttribute('transform');
    loader.setAttribute('d', updateLoaderPath(0));
    loader.removeAttribute('stroke-dasharray'); loader.removeAttribute('stroke-dashoffset');
    loader.setAttribute('stroke-width', '3.21285');
    confetti.forEach(node => {
      node.style.removeProperty('transform'); node.style.removeProperty('opacity'); node.style.removeProperty('z-index');
    });
    cursor.style.removeProperty('transform'); cursor.style.removeProperty('opacity');
  } });
}
