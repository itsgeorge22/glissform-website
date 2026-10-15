import { springDisplacement } from './home-next/objectMotion';

/** One native modal for every download entry point, without taking over the download. */
export function setupInstallationGuide(dialog: HTMLDialogElement) {
  const panel = dialog.querySelector<HTMLElement>('.installation-guide__panel')!;
  const backdrop = dialog.querySelector<HTMLElement>('.installation-guide__backdrop')!;
  const body = dialog.querySelector<HTMLElement>('.installation-guide__body')!;
  const title = dialog.querySelector<HTMLElement>('#installation-guide-title')!;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let animations: Animation[] = [];
  let opener: HTMLElement | null = null;
  let pointerStartedOutside = false;

  const cancelAnimations = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
  };

  const restorePage = () => {
    document.documentElement.classList.remove('installation-guide-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  };

  const settle = () => {
    cancelAnimations();
    if (!visible && dialog.open) {
      dialog.close();
      restorePage();
    }
  };

  const reveal = (show: boolean, trigger?: HTMLElement) => {
    if (show === visible) return;
    const wasClosed = !dialog.open;
    const panelStyle = getComputedStyle(panel);
    const opacity = wasClosed ? 0 : Number(panelStyle.opacity);
    const y = wasClosed ? 24 : new DOMMatrixReadOnly(panelStyle.transform).m42;
    const shade = wasClosed ? 0 : Number(getComputedStyle(backdrop).opacity);
    cancelAnimations();
    visible = show;

    if (show && wasClosed) {
      opener = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      document.documentElement.classList.add('installation-guide-open');
      dialog.showModal();
      body.scrollTop = 0;
      title.focus({ preventScroll: true });
    }
    if (motion.matches) { settle(); return; }

    // The whole reading surface moves together using the site's quiet spring.
    const frames = show
      ? Array.from({ length: 41 }, (_, index) => {
          const progress = index / 40;
          return { offset: progress,
            opacity: opacity + (1 - opacity) * Math.min(1, progress * 2.5),
            transform: `translateY(${y * springDisplacement(progress, 9, 10)}px)` };
        })
      : [{ opacity, transform: `translateY(${y}px)` }, { opacity: 0, transform: 'translateY(16px)' }];
    const surface = panel.animate(frames, {
      duration: show ? 520 : 220, easing: show ? 'linear' : 'cubic-bezier(.4, 0, 1, 1)', fill: 'both',
    });
    const dimming = backdrop.animate([{ opacity: shade }, { opacity: show ? 1 : 0 }], {
      duration: show ? 280 : 220, easing: 'ease-out', fill: 'both',
    });
    animations = [surface, dimming];
    surface.onfinish = settle;
  };

  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const help = event.target.closest<HTMLAnchorElement>('a[data-installation-guide]');
    if (help) {
      event.preventDefault();
      reveal(true, help);
      return;
    }
    const download = event.target.closest<HTMLAnchorElement>('a[data-download-placement]');
    if (download && !event.defaultPrevented) {
      // Preserve the original link, browser download, and existing consent-based analytics.
      reveal(true, download);
    }
  };
  const dismiss = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-installation-close]') ||
      (pointerStartedOutside && (target === dialog || target === backdrop))) reveal(false);
    pointerStartedOutside = false;
  };
  const pointerDown = (event: PointerEvent) => {
    pointerStartedOutside = event.target === dialog || event.target === backdrop;
  };
  const cancel = (event: Event) => { event.preventDefault(); reveal(false); };
  const close = () => {
    // A queued close event must not dismiss a guide that has already reopened.
    if (dialog.open) return;
    visible = false; cancelAnimations(); restorePage();
  };
  const pagehide = () => { visible = false; settle(); };
  const visibility = () => { if (document.hidden) settle(); };

  document.addEventListener('click', click);
  dialog.addEventListener('click', dismiss);
  dialog.addEventListener('pointerdown', pointerDown);
  dialog.addEventListener('cancel', cancel);
  dialog.addEventListener('close', close);
  motion.addEventListener('change', settle);
  window.addEventListener('pagehide', pagehide);
  document.addEventListener('visibilitychange', visibility);

  return () => {
    document.removeEventListener('click', click);
    dialog.removeEventListener('click', dismiss);
    dialog.removeEventListener('pointerdown', pointerDown);
    dialog.removeEventListener('cancel', cancel);
    dialog.removeEventListener('close', close);
    motion.removeEventListener('change', settle);
    window.removeEventListener('pagehide', pagehide);
    document.removeEventListener('visibilitychange', visibility);
    pagehide();
  };
}
