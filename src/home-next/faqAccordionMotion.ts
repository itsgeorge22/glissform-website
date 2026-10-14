const timing: KeyframeAnimationOptions = {
  duration: 360,
  easing: 'cubic-bezier(.22, 1, .36, 1)',
  fill: 'both',
};

/** Enhance native details; without JavaScript their exclusive group still works. */
export function animateFaqAccordion(list: HTMLElement) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...list.querySelectorAll<HTMLDetailsElement>('details')].map(details => ({
    details,
    summary: details.querySelector<HTMLElement>('summary')!,
    answer: details.querySelector<HTMLElement>('.faq-section__answer')!,
    name: details.getAttribute('name'),
    expanded: details.open,
    animations: [] as Animation[],
  }));
  type Item = (typeof items)[number];

  function cancel(item: Item) {
    for (const animation of item.animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    item.animations = [];
  }

  function finish(item: Item) {
    item.details.open = item.expanded;
    cancel(item);
    item.details.style.removeProperty('height');
    item.details.style.removeProperty('overflow');
  }

  function setExpanded(item: Item, expanded: boolean) {
    // Sample the currently rendered frame before cancelling, including reversals.
    const height = item.details.getBoundingClientRect().height;
    const padding = getComputedStyle(item.summary).paddingBottom;
    const opacity = item.details.open ? getComputedStyle(item.answer).opacity : '0';
    cancel(item);
    item.expanded = expanded;
    item.details.dataset.expanded = String(expanded);
    item.summary.setAttribute('aria-expanded', String(expanded));
    if (!expanded && item.answer.contains(document.activeElement)) {
      item.summary.focus({ preventScroll: true });
    }
    item.answer.inert = !expanded;
    item.answer.setAttribute('aria-hidden', String(!expanded));

    // Measure the natural endpoint, then keep details open until collapse ends.
    item.details.style.removeProperty('height');
    item.details.open = expanded;
    const targetHeight = item.details.getBoundingClientRect().height;
    const targetPadding = getComputedStyle(item.summary).paddingBottom;
    if (reducedMotion.matches || document.hidden || !item.details.animate) {
      finish(item);
      return;
    }

    item.details.open = true;
    item.details.style.height = `${targetHeight}px`;
    item.details.style.overflow = 'hidden';
    const expansion = item.details.animate([
      { height: `${height}px` },
      { height: `${targetHeight}px` },
    ], timing);
    item.animations = [
      expansion,
      item.summary.animate([{ paddingBottom: padding }, { paddingBottom: targetPadding }], timing),
      item.answer.animate([{ opacity }, { opacity: expanded ? 1 : 0 }], {
        ...timing, duration: 220, easing: 'ease-out',
      }),
    ];
    expansion.onfinish = () => finish(item);
  }

  const listeners = items.map(item => {
    // Native exclusivity would hide the previous answer before it can animate.
    item.details.removeAttribute('name');
    item.details.dataset.expanded = String(item.expanded);
    item.summary.setAttribute('aria-expanded', String(item.expanded));
    item.answer.inert = !item.expanded;
    item.answer.setAttribute('aria-hidden', String(!item.expanded));
    const click = (event: MouseEvent) => {
      event.preventDefault();
      const expanded = !item.expanded;
      if (expanded) {
        for (const other of items) {
          if (other !== item && other.expanded) setExpanded(other, false);
        }
      }
      setExpanded(item, expanded);
    };
    item.summary.addEventListener('click', click);
    return () => item.summary.removeEventListener('click', click);
  });

  const settle = () => items.forEach(finish);
  const onVisibilityChange = () => { if (document.hidden) settle(); };
  const onMotionChange = () => { if (reducedMotion.matches) settle(); };
  window.addEventListener('resize', settle);
  window.addEventListener('pagehide', settle);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', onMotionChange);

  return () => {
    settle();
    listeners.forEach(remove => remove());
    window.removeEventListener('resize', settle);
    window.removeEventListener('pagehide', settle);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.removeEventListener('change', onMotionChange);
    for (const item of items) {
      delete item.details.dataset.expanded;
      item.summary.removeAttribute('aria-expanded');
      item.answer.removeAttribute('aria-hidden');
      item.answer.inert = false;
      if (item.name) item.details.setAttribute('name', item.name);
    }
  };
}
