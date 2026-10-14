import { useLayoutEffect, useRef } from 'react';
import { FeatureCursor } from './FeatureCursor';
import { FeatureMenuBar, FeatureWallpaper } from './FeatureDesktop';
import { animateStartAtLogin } from './startAtLoginMotion';
import { useLocalClock } from './localClock';
import './start-at-login-visual.scss';

export function StartAtLoginVisual() {
  const clock = useLocalClock();
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateStartAtLogin(visual.current!), []);

  return <div className="start-at-login-visual" ref={visual}>
    <div className="start-at-login-visual__screen">
      <FeatureWallpaper />
      <div className="start-at-login-visual__notch">
        <img src={`${import.meta.env.BASE_URL}assets/start-at-login/notch.svg`} width="128" height="25" alt="" />
      </div>
      <FeatureMenuBar />
      <div className="start-at-login-visual__login">
        <div className="start-at-login-visual__date">{clock?.date}</div>
        <div className="start-at-login-visual__time">{clock?.lockTime}</div>
      </div>
    </div>
    <div className="start-at-login-visual__credentials">
      <div className="start-at-login-visual__password">
        <div className="start-at-login-visual__dots" />
        <div className="start-at-login-visual__caret" />
        <div className="start-at-login-visual__submit">
          <img src={`${import.meta.env.BASE_URL}assets/start-at-login/sign-in-arrow.svg`} width="26.6667" height="26.6667" alt="" />
        </div>
      </div>
      <div className="start-at-login-visual__hint">Touch ID or Enter Password</div>
    </div>
    <FeatureCursor />
  </div>;
}
