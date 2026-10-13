import { createTextReveal, revealBlurFilter, textLinePose } from './textRevealMotion.ts';
import { settingsFeaturesPose, nextSettingsFeature, settingsFeaturesTiming,
  settingsFeatureEntrancePose, settingsFeatureEntranceTiming, settingsFeaturePanelPoses } from './settingsFeaturesChoreography.ts';
import { createSettingsWheelGesture } from './settingsFeaturesInput.ts';
import { cancelHeroFrame, requestSceneFrame } from '../hero-test-animation/frameSync.ts';
import { subscribeFeatureEntry, type FeatureEntry } from './featureEntry.ts';

/** One gesture starts a handoff; opposite input retraces it without a jump. */
export function animateSettingsFeatures(section: HTMLElement, followMacScene = false) {
  const stage = section.querySelector<HTMLElement>('.settings-features__stage')!;
  const items = Array.from(stage.querySelectorAll<HTMLElement>('.settings-features__item')).map(element => {
    const copy = element.querySelector<HTMLElement>('.settings-features__copy')!;
    return {
      copy,
      icon: copy.querySelector<HTMLElement>('.settings-features__icon'),
      panel: element.querySelector<HTMLElement>('.settings-features__panel')!,
      // Headline and subtitle are one ordered set of lines, with one clock and direction.
      reveal: createTextReveal(copy, { travelPx: settingsFeaturesTiming.copyTravelPx, directionalStagger: true }),
    };
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1056px)');
  let frame = 0, height = 1, animated = false, disposed = false, current = 0;
  const gesture = createSettingsWheelGesture();
  let entry: FeatureEntry = { linked: false, ready: false, coverage: 0 };
  let entranceStarted = false, entranceElapsed = 0, entranceUpdatedAt = 0, exitCoverage = 1;
  let earlyEntrance = false;
  const entranceAllowed = () => entry.ready || earlyEntrance;
  const entering = () => entry.linked && entranceStarted && entranceAllowed() && entranceElapsed < settingsFeatureEntranceTiming.duration;
  let transition: { from: number; to: number; elapsed: number; updatedAt: number; playback: 1 | -1 } | undefined;
  const styles = new WeakMap<HTMLElement, Map<string, string>>();
  const setStyle = (element: HTMLElement, property: string, value: string) => {
    let previous = styles.get(element);
    if (!previous) { previous = new Map(); styles.set(element, previous); }
    if (previous.get(property) === value) return;
    previous.set(property, value);
    element.style.setProperty(property, value);
  };
  const reset = () => {
    section.removeAttribute('data-motion');
    section.removeAttribute('data-scene-linked');
    for (const { copy, panel, icon } of items) {
      panel.removeAttribute('data-feature-active');
      panel.removeAttribute('data-feature-departing');
      copy.style.removeProperty('visibility');
      icon?.style.removeProperty('opacity');
      icon?.style.removeProperty('transform');
      icon?.style.removeProperty('filter');
      if (icon) styles.delete(icon);
      panel.style.removeProperty('transform');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('visibility');
      panel.style.removeProperty('--pattern-scale-x');
      panel.style.removeProperty('--pattern-scale-y');
      panel.style.removeProperty('--pattern-y');
      for (const line of copy.querySelectorAll<HTMLElement>('.text-reveal__content')) {
        line.style.removeProperty('opacity');
        line.style.removeProperty('transform');
        line.style.removeProperty('--text-reveal-filter');
      }
      styles.delete(copy); styles.delete(panel);
    }
  };
  const draw = (elapsed = 0) => {
    const pose = settingsFeaturesPose(elapsed);
    const direction = transition ? Math.sign(transition.to - transition.from) : 1;
    const copyPose = transition && direction > 0
      ? settingsFeaturesPose(elapsed - settingsFeaturesTiming.upwardIconLeadMs) : pose;
    // Scroll can dismiss the feature immediately; only the entrance clock restores it.
    const exiting = !entranceAllowed() && (entry.returning || entranceStarted);
    const entrance = entry.linked && (!entranceStarted || entranceElapsed < settingsFeatureEntranceTiming.duration || entry.coverage < 1)
      ? settingsFeatureEntrancePose(entranceStarted ? entranceElapsed * (exiting ? exitCoverage ** 2 : 1) : 0,
        exiting || earlyEntrance ? 1 : entry.coverage) : undefined;
    const position = transition ? transition.from + direction * pose.panel : current;
    const panels = settingsFeaturePanelPoses(position, items.length, height - 128, entrance?.scale ?? 1);
    items.forEach((item, index) => {
      const outgoing = !!transition && index === transition.from;
      const incoming = !!transition && index === transition.to;
      const settled = !transition && index === current;
      // An already-running demo stays continuous while its panel fades over the
      // returning Mac. Once hidden, it waits for settlement before starting again.
      const returningDemo = !!entry.returning && index === 0 && (entrance?.opacity ?? 0) > .001
        && (item.panel.getAttribute('data-feature-active') === 'true' || item.panel.getAttribute('data-feature-departing') === 'true');
      // Nested demonstrations start only after the panel and copy have settled.
      const visualActive = String(settled && !entrance);
      if (item.panel.getAttribute('data-feature-active') !== visualActive) {
        item.panel.setAttribute('data-feature-active', visualActive);
      }
      // Keep the original demo running through the entire handoff, including
      // reversals. Incoming demos still wait for both panel and copy to settle.
      const visualDeparting = String((outgoing && !entrance) || returningDemo);
      if (item.panel.getAttribute('data-feature-departing') !== visualDeparting) {
        item.panel.setAttribute('data-feature-departing', visualDeparting);
      }
      const visibleCopy = entrance ? index === 0 && entrance.copy > 0
        : settled || (outgoing && copyPose.exitCopy > 0) || (incoming && copyPose.enterCopy > 0);
      setStyle(item.copy, 'visibility', visibleCopy ? 'visible' : 'hidden');
      if (entrance) {
        if (index === 0) item.reveal(entrance.copy);
      } else if (outgoing) {
        // Reverse the line reveal toward the current scroll direction's exit.
        // Both departing and arriving lines travel up on down-scroll, and vice versa.
        item.reveal(copyPose.exitCopy, -direction);
      } else if (incoming) {
        item.reveal(copyPose.enterCopy, direction);
      } else if (settled) {
        item.reveal(1);
      }
      if (item.icon && visibleCopy) {
        const progress = entrance ? entrance.copy : outgoing ? copyPose.exitCopy : incoming ? copyPose.enterCopy : 1;
        // Upward icon exits lead the copy by 100ms at the same speed.
        // Derive both from elapsed time so reversals retrace without a jump.
        const iconProgress = !entrance && outgoing && direction > 0
          ? pose.exitCopy : progress;
        const iconPose = textLinePose(iconProgress, 0, 1, outgoing ? -direction : direction);
        // Keep the shared copy easing, with a stronger 60% starting scale.
        const iconScale = 1 - 2 * (1 - iconPose.scale);
        const iconTravel = transition && direction < 0
          ? 80 : iconPose.y < 0 ? 40 : settingsFeaturesTiming.copyTravelPx;
        setStyle(item.icon, 'opacity', String(iconPose.opacity));
        setStyle(item.icon, 'filter', revealBlurFilter(iconPose.opacity));
        setStyle(item.icon, 'transform', iconPose.y === 0 && iconScale === 1 ? 'none'
          : `translate3d(0, ${iconPose.y * iconTravel / 100}px, 0) scale(${iconScale})`);
      }
      // Keep the whole panel column connected, including neighboring previews.
      const { scaleY } = panels[index];
      const y = panels[index].y + (entrance?.y ?? 0);
      // Remove fully faded panels from painting, including the tiny numerical
      // tail of the fade. They must not leave a composited ghost over the Mac.
      const panelOpacity = entrance?.opacity ?? 1;
      const panelHidden = panelOpacity <= .001;
      setStyle(item.panel, 'opacity', String(panelHidden ? 0 : panelOpacity));
      setStyle(item.panel, 'visibility', panelHidden ? 'hidden' : 'visible');
      const entranceScale = entrance?.scale ?? 1;
      setStyle(item.panel, '--pattern-scale-x', String(1 / entranceScale));
      setStyle(item.panel, '--pattern-scale-y', String(1 / (entranceScale * scaleY)));
      // Texture drifts against the shell's travel and returns to center at rest.
      const patternY = -96 * Math.max(-1, Math.min(1, index - position));
      setStyle(item.panel, '--pattern-y', `${patternY}px`);
      setStyle(item.panel, 'transform', entrance
        ? `translate3d(0, ${y}px, 0) scale(${entrance.scale}) scaleY(${scaleY})`
        : y === 0 && scaleY === 1 ? 'none' : `translate3d(0, ${y}px, 0) scaleY(${scaleY})`);
    });
  };
  const advance = (time: number) => {
    if (entering()) {
      entranceElapsed = Math.min(settingsFeatureEntranceTiming.duration, entranceElapsed + time - entranceUpdatedAt);
      entranceUpdatedAt = time;
    }
    if (!transition) return;
    const duration = settingsFeaturesTiming.duration
      + (transition.to > transition.from ? settingsFeaturesTiming.upwardIconLeadMs : 0);
    transition.elapsed = Math.max(0, Math.min(duration,
      transition.elapsed + (time - transition.updatedAt) * transition.playback));
    transition.updatedAt = time;
    if ((transition.playback === 1 && transition.elapsed === duration)
      || (transition.playback === -1 && transition.elapsed === 0)) {
      current = transition.playback === 1 ? transition.to : transition.from;
      transition = undefined;
    }
  };
  const tick = (time: number) => {
    frame = 0;
    if (!animated || disposed || (!transition && !entering()) || document.hidden) return;
    advance(time);
    draw(transition?.elapsed);
    if ((transition || entering()) && !frame) frame = requestSceneFrame(tick);
  };
  const pinned = () => {
    const bounds = section.getBoundingClientRect();
    return animated && (!entry.linked || entry.ready) && bounds.top <= 1 && bounds.bottom >= height - 1;
  };
  const pageScroll = () => {
    if (!pinned()) {
      if (!entry.linked || entry.coverage === 0) gesture.reset();
    }
  };
  const start = (direction: number) => {
    if (disposed) return;
    advance(performance.now());
    if (entering()) { draw(); return; }
    if (transition) {
      const playback = direction === Math.sign(transition.to - transition.from) ? 1 : -1;
      // Discard repeated input; never queue a second handoff.
      if (playback === transition.playback) return;
      // Keep the original pair/poses and turn time around at this exact point.
      transition.playback = playback;
      draw(transition.elapsed);
      return;
    }
    const next = nextSettingsFeature(current, direction, items.length);
    if (next === current) return;
    transition = { from: current, to: next, elapsed: 0, updatedAt: performance.now(), playback: 1 };
    draw();
    if (!frame) frame = requestSceneFrame(tick);
  };
  const wheel = (event: WheelEvent) => {
    if (!event.deltaY || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (!pinned()) {
      // Remember the tail that reaches the white reveal so it cannot skip the
      // first feature. Ordinary standalone section entry retains its behavior.
      if (entry.linked && entry.coverage > 0) {
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
        gesture.read(performance.now(), event.deltaY * unit);
      } else gesture.reset();
      return;
    }
    const time = performance.now(), direction = Math.sign(event.deltaY);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
    // Settle the timeline before judging this event: the first fresh scroll at
    // completion belongs to the next handoff, even before the next frame runs.
    advance(time);
    const busy = !!transition || entering();
    const fresh = gesture.read(time, event.deltaY * unit, !busy);
    // Direction changes retrace the active handoff immediately. Only a fresh
    // gesture can request the next adjacent feature or release a boundary.
    const boundary = nextSettingsFeature(current, direction, items.length) === current;
    if (fresh && boundary && (!busy || (direction < 0 && entering()))) return;
    event.preventDefault();
    if (fresh) start(direction);
  };
  const key = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !pinned()) return;
    if (event.target instanceof HTMLElement && event.target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
    const direction = ['ArrowDown', 'PageDown'].includes(event.key) ? 1
      : ['ArrowUp', 'PageUp'].includes(event.key) ? -1
      : event.key === ' ' ? (event.shiftKey ? -1 : 1) : 0;
    if (!direction) return;
    const boundary = nextSettingsFeature(current, direction, items.length) === current;
    if (!transition && !event.repeat && boundary) return;
    event.preventDefault();
    if (!event.repeat) start(direction);
  };
  const measure = () => {
    if (!animated || disposed) return;
    height = stage.clientHeight;
    advance(performance.now());
    draw(transition?.elapsed);
  };
  const settle = () => {
    gesture.reset();
    cancelHeroFrame(frame); frame = 0;
    if (transition) current = transition.playback === 1 ? transition.to : transition.from;
    transition = undefined;
    if (entranceStarted) entranceElapsed = settingsFeatureEntranceTiming.duration;
    if (animated) draw();
  };
  const preference = () => {
    settle();
    animated = desktop.matches && !reducedMotion.matches;
    reset();
    if (animated) {
      section.dataset.motion = 'triggered';
      if (entry.linked) section.dataset.sceneLinked = 'true';
      measure();
    }
  };
  const visibility = () => { if (document.hidden) settle(); else measure(); };
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  // Capture wheel input before it reaches any rendered child/layer.
  window.addEventListener('wheel', wheel, { passive: false, capture: true });
  window.addEventListener('scroll', pageScroll, { passive: true });
  window.addEventListener('keydown', key, true);
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  window.addEventListener('pagehide', settle);
  document.addEventListener('visibilitychange', visibility);
  reducedMotion.addEventListener('change', preference);
  desktop.addEventListener('change', preference);
  preference();
  const stopEntry = followMacScene ? subscribeFeatureEntry(next => {
    const wasLinked = entry.linked, wasAllowed = entranceAllowed();
    advance(performance.now());
    // Start the time-driven entrance once the forward dissolve is 80% white.
    // Keep it running while the camera settles; a backward move releases it
    // to the existing exit poses immediately.
    if (!next.linked || next.ready || next.coverage < entry.coverage) earlyEntrance = false;
    else if (next.coverage > entry.coverage && next.coverage >= .8) earlyEntrance = true;
    const allowed = next.ready || earlyEntrance;
    if (next.linked && !allowed) exitCoverage = Math.min(exitCoverage, next.coverage);
    if (allowed && !wasAllowed) {
      // Resume from the visible exit pose, then finish automatically with no
      // more scrolling. A fully dismissed feature replays its whole entrance.
      entranceElapsed *= exitCoverage ** 2;
      exitCoverage = 1;
      entranceUpdatedAt = performance.now();
    }
    entry = next;
    if (!animated) return;
    if (wasLinked && !next.linked) settle();
    if (next.linked) section.dataset.sceneLinked = 'true';
    else section.removeAttribute('data-scene-linked');
    if (next.linked && (!wasLinked || !next.ready)) {
      current = 0; transition = undefined;
    }
    // Leaving the dive resets the entrance; revisiting its endpoint runs it again.
    if (!next.linked || (next.coverage === 0 && !next.returning)) {
      entranceStarted = false; entranceElapsed = 0; exitCoverage = 1;
      cancelHeroFrame(frame); frame = 0;
    }
    if (allowed && !entranceStarted) {
      entranceStarted = true; entranceElapsed = 0; entranceUpdatedAt = performance.now();
    } else if (!allowed) {
      entranceUpdatedAt = performance.now();
      cancelHeroFrame(frame); frame = 0;
    }
    measure();
    if (entering() && !frame && !document.hidden) frame = requestSceneFrame(tick);
  }) : () => {};

  return () => {
    disposed = true;
    stopEntry();
    cancelHeroFrame(frame);
    observer.disconnect();
    window.removeEventListener('wheel', wheel, true);
    window.removeEventListener('scroll', pageScroll);
    window.removeEventListener('keydown', key, true);
    window.removeEventListener('resize', measure);
    window.removeEventListener('pageshow', measure);
    window.removeEventListener('pagehide', settle);
    document.removeEventListener('visibilitychange', visibility);
    reducedMotion.removeEventListener('change', preference);
    desktop.removeEventListener('change', preference);
    reset();
  };
}
