import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { asset, brandSrcSet } from './assets';
import ResponsiveBreak from './ResponsiveBreak';

const sparks = Array.from({ length: 40 }, (_, index) => ({
  left: `${4 + ((index * 37) % 92)}%`,
  top: `${20 + ((index * 23) % 70)}%`,
}));

export default function DownloadPanel({ children }: { children: ReactNode }) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const stars = Array.from(panel.querySelectorAll<HTMLElement>('.download-panel__spark'));
    let inView = false;
    let frame = 0;
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    const updatePlayback = () => {
      panel.dataset.playing = String(inView && !document.hidden && !motion.matches);
      if (motion.matches || document.hidden) resetPointer();
    };
    const resetPointer = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      stars.forEach(star => {
        star.style.removeProperty('transform');
        star.style.removeProperty('filter');
      });
    };
    const movePointer = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches) return;
      const bounds = panel.getBoundingClientRect();
      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
      width = bounds.width;
      height = bounds.height;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        stars.forEach((star, index) => {
          const dx = x - parseFloat(sparks[index].left) * width / 100;
          const dy = y - parseFloat(sparks[index].top) * height / 100;
          const distance = Math.hypot(dx, dy);
          const influence = Math.max(0, 1 - distance / 190);
          // Nearby stars lean toward the pointer, then ease back on exit.
          star.style.transform = `translate(${dx * influence * .18}px, ${dy * influence * .18}px) scale(${1 + influence * .65})`;
          star.style.filter = `brightness(${1 + influence * 1.8})`;
        });
        frame = 0;
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) resetPointer();
      updatePlayback();
    });
    observer.observe(panel);
    panel.addEventListener('pointermove', movePointer);
    panel.addEventListener('pointerleave', resetPointer);
    panel.addEventListener('pointercancel', resetPointer);
    document.addEventListener('visibilitychange', updatePlayback);
    motion.addEventListener('change', updatePlayback);
    return () => {
      observer.disconnect();
      resetPointer();
      panel.removeEventListener('pointermove', movePointer);
      panel.removeEventListener('pointerleave', resetPointer);
      panel.removeEventListener('pointercancel', resetPointer);
      document.removeEventListener('visibilitychange', updatePlayback);
      motion.removeEventListener('change', updatePlayback);
    };
  }, []);

  return <section ref={panelRef} className="download-panel shell" aria-labelledby="download-title">
    <div className="download-panel__atmosphere" aria-hidden="true">
      <div className="download-panel__aurora download-panel__aurora--blue" />
      <div className="download-panel__aurora download-panel__aurora--violet" />
      {sparks.map((position, index) => <i className="download-panel__spark" key={index} style={{
        ...position,
        '--spark-size': `${index % 7 === 0 ? 4 : index % 3 === 0 ? 2.5 : 1.5}px`,
        '--spark-duration': `${6 + (index % 5)}s`,
        '--spark-delay': `${-index * 1.7}s`,
      } as CSSProperties}><b className="download-panel__spark-core" /></i>)}
    </div>
    <div className="download-panel__brand">
      <img src={asset('navbar-glissform-icon.png')} srcSet={brandSrcSet(true)} sizes="28px" width="28" height="28" loading="lazy" decoding="async" alt="" />
      <span>Glissform</span>
    </div>
    <div className="download-panel__copy">
      <h2 id="download-title">A Little More Magic</h2>
      <p>Subtle animations and thoughtful details for your Mac.<ResponsiveBreak />Start with Seamless Close and Battery Ripple.</p>
    </div>
    {children}
  </section>;
}
