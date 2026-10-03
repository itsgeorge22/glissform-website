import { useEffect, useRef, type ReactNode } from 'react';

export default function GlassDownloadLink({ href, label = 'Download for MacOS', icon }: { href: string; label?: string; icon?: ReactNode }) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let x = .5;
    let y = .5;

    const reset = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      link.style.removeProperty('--glass-rotate-x');
      link.style.removeProperty('--glass-rotate-y');
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches || event.pointerType === 'touch') return;
      // The anchor stays still; only its glass and contents move, so edges
      // remain easy to target and cannot repeatedly trigger enter/leave.
      const bounds = link.getBoundingClientRect();
      x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        link.style.setProperty('--glass-x', `${x * 100}%`);
        link.style.setProperty('--glass-y', `${y * 100}%`);
        link.style.setProperty('--glass-rotate-x', `${(.5 - y) * 6}deg`);
        link.style.setProperty('--glass-rotate-y', `${(x - .5) * 8}deg`);
        frame = 0;
      });
    };
    const resetFocus = () => {
      reset();
      link.style.removeProperty('--glass-x');
      link.style.removeProperty('--glass-y');
    };

    link.addEventListener('pointerenter', move);
    link.addEventListener('pointermove', move);
    link.addEventListener('pointerleave', reset);
    link.addEventListener('pointercancel', reset);
    link.addEventListener('blur', resetFocus);
    window.addEventListener('blur', resetFocus);
    document.addEventListener('visibilitychange', resetFocus);
    motion.addEventListener('change', resetFocus);
    pointer.addEventListener('change', resetFocus);
    return () => {
      reset();
      link.removeEventListener('pointerenter', move);
      link.removeEventListener('pointermove', move);
      link.removeEventListener('pointerleave', reset);
      link.removeEventListener('pointercancel', reset);
      link.removeEventListener('blur', resetFocus);
      window.removeEventListener('blur', resetFocus);
      document.removeEventListener('visibilitychange', resetFocus);
      motion.removeEventListener('change', resetFocus);
      pointer.removeEventListener('change', resetFocus);
    };
  }, []);

  return <a ref={linkRef} className="download-link download-link--secondary" href={href}>
    <span className="download-link__glass" aria-hidden="true"><span className="download-link__glint" /></span>
    <span className="download-link__label">{label}{icon}</span>
  </a>;
}
