import { ease, timedCopyRevealTiming, subtitleRevealCue } from './choreography.ts';
import { createTextReveal } from './textRevealMotion.ts';
import { cancelHeroFrame, requestSceneFrame } from '../hero-test-animation/frameSync.ts';
import { springDisplacement } from './objectMotion.ts';
import { createHeroPrelude } from './heroPrelude.ts';
import { heroPreludeTiming } from './heroScreenFormation.ts';
import { elementDesignScale } from './designScale.ts';

/** A single opening sequence; scrolling takes over with fully settled content. */
export function playHeroEntrance(content: HTMLElement) {
  const scale = elementDesignScale(content);
  const prelude = createHeroPrelude(content);
  const headline = content.querySelector<HTMLElement>('h1')!;
  const heading = createTextReveal(headline);
  const description = createTextReveal(content.querySelector<HTMLElement>('.hero-test__copy p')!);
  const { headline: headlineDuration, subtitle: subtitleDuration } = timedCopyRevealTiming;
  // Supporting copy follows the final headline line's start by the shared lag.
  const lineCount = headline.querySelectorAll('.text-reveal__content').length;
  const subtitleDelay = subtitleRevealCue(lineCount) * headlineDuration;
  const groups = [
    { selector: '.hero-test__menu', start: 0, duration: 880, y: -18, scale: 1, tilt: 0, damping: 8, frequency: 10 },
    { selector: '.hero-test__brand', start: 180, duration: 920, y: 16, scale: .94, tilt: 0, damping: 8, frequency: 11 },
    { selector: '.hero-animation__action', start: 200, duration: 1100, y: 36, scale: .86, tilt: -10, damping: 7.8, frequency: 12.5 },
    { selector: '.hero-test__nav-dock', start: 0, duration: 1000, y: 24, scale: .98, tilt: 0, damping: 9, frequency: 10 },
  ].map(group => ({ ...group, element: content.querySelector<HTMLElement>(group.selector)!, previous: -1 }));
  const contentDuration = heroPreludeTiming.content + Math.max(subtitleDelay + subtitleDuration, ...groups.map(group => group.start + group.duration));
  const duration = Math.max(contentDuration, heroPreludeTiming.duration);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, start: number | undefined, finished = false, disposed = false, contentSettled = false;
  const progress = (time: number, delay: number, duration: number) => Math.max(0, Math.min(1, (time - delay) / duration));
  const draw = (time: number) => {
    prelude.draw(time);
    const contentTime = time - heroPreludeTiming.content;
    heading(progress(contentTime, 0, headlineDuration));
    description(progress(contentTime, subtitleDelay, subtitleDuration));
    for (const group of groups) {
      const phase = progress(contentTime, group.start, group.duration);
      if (phase === group.previous) continue;
      group.previous = phase;
      const remaining = springDisplacement(phase, group.damping, group.frequency);
      // Become clear early, leaving the visible spring to carry the arrival.
      // Opacity stays monotonic while position and scale gently overshoot.
      group.element.style.opacity = String(ease(phase / .24));
      group.element.style.transform = phase === 1 ? 'none'
        : `perspective(${800 * scale}px) translate3d(0, ${remaining * group.y * scale}px, 0) rotateX(${remaining * group.tilt}deg) scale(${1 + (group.scale - 1) * remaining})`;
    }
    if (time >= contentDuration && !contentSettled) {
      contentSettled = true;
      content.dataset.entrance = 'complete';
      // Release the content at its original endpoint while the longer star
      // pulse continues; centering and hover remain owned by their CSS.
      for (const { element } of groups) {
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
      }
    }
  };
  const stopListening = () => {
    window.removeEventListener('scroll', finish);
    window.removeEventListener('pagehide', finish);
    window.removeEventListener('resize', finish);
    document.removeEventListener('visibilitychange', visibility);
    content.removeEventListener('focusin', finish);
    content.removeEventListener('pointerdown', finish);
    motion.removeEventListener('change', preference);
  };
  const finish = () => {
    if (disposed || finished) return;
    finished = true;
    cancelHeroFrame(frame); frame = 0;
    draw(duration);
    prelude.finish();
    stopListening();
  };
  const visibility = () => { if (document.hidden) finish(); };
  const preference = () => { if (motion.matches) finish(); };
  const tick = (time: number) => {
    frame = 0;
    if (disposed || finished) return;
    start ??= time;
    const elapsed = time - start;
    if (elapsed >= duration) { finish(); return; }
    draw(elapsed);
    frame = requestSceneFrame(tick);
  };

  if (motion.matches || window.scrollY > 0 || document.hidden || content.contains(document.activeElement)) finish();
  else {
    draw(0);
    content.dataset.entrance = 'running';
    window.addEventListener('scroll', finish, { passive: true });
    window.addEventListener('pagehide', finish);
    window.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', visibility);
    content.addEventListener('focusin', finish);
    content.addEventListener('pointerdown', finish);
    motion.addEventListener('change', preference);
    // Begin after the final font metrics are ready, including a cold load.
    void document.fonts.ready.then(() => {
      if (!disposed && !finished) frame = requestSceneFrame(tick);
    });
  }
  return () => {
    finish();
    disposed = true;
    cancelHeroFrame(frame);
    stopListening();
  };
}
