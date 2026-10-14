import { useLayoutEffect, useRef } from 'react';
import { animateBlurVisual, animateDesktopReturnVisual, type DesktopReturnDemo } from './seamlessFeatureMotion';
import './seamless-feature-visuals.scss';

export function BlurVisual() {
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateBlurVisual(visual.current!), []);

  return <div className="seamless-mini-visual blur-visual" ref={visual}>
    <div className="seamless-mini-visual__composition">
      <div className="blur-visual__square" />
      <div className="blur-visual__label">
        <div className="blur-visual__labels">
          {['Off', 'Subtle', 'Regular', 'High', 'Off'].map((label, index) => <span key={index}>{label}</span>)}
        </div>
      </div>
    </div>
  </div>;
}

export function DesktopReturnVisual({ mode }: { mode: DesktopReturnDemo }) {
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateDesktopReturnVisual(visual.current!, mode), [mode]);

  return <div className={`seamless-mini-visual desktop-return-visual desktop-return-visual--${mode}`} ref={visual}>
    <div className="seamless-mini-visual__composition">
      <div className="desktop-return-visual__surface">
        {mode === 'connection' && <div className="desktop-return-visual__glow" />}
        {mode === 'pause' && <svg className="desktop-return-visual__timer" viewBox="0 0 44 44" aria-hidden="true">
          <circle className="desktop-return-visual__timer-track" cx="22" cy="22" r="18" />
          <circle className="desktop-return-visual__timer-progress" cx="22" cy="22" r="18" pathLength="1" />
          <path className="desktop-return-visual__pause" d="M 18.5 17 V 27 M 25.5 17 V 27" />
          <path className="desktop-return-visual__check" d="m 15.5 22 4.5 4.5 8.5-9" pathLength="1" />
        </svg>}
      </div>
      {mode === 'escape' && <div className="desktop-return-visual__key">
        <div className="desktop-return-visual__key-face"><span>esc</span></div>
      </div>}
    </div>
  </div>;
}
