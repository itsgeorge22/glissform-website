import { useLayoutEffect, useRef } from 'react';
import { animateAlwaysActive } from './alwaysActiveMotion';
import { FeatureCursor } from './FeatureCursor';
import './always-active-visual.scss';

const settings = [
  ['background', 'Run in background', 'Keep effects active after closing Settings.'],
  ['menubar', 'Menu bar icon', 'Open Settings and controls from the menu bar.'],
  ['login', 'Launch at login', 'Open Glissform when you sign in.'],
  ['updates', 'Automatic updates', 'Download updates and install when Glissform quits.'],
];

export function AlwaysActiveVisual() {
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateAlwaysActive(visual.current!), []);

  return <div className="always-active-visual" ref={visual}>
    <div className="always-active-visual__window">
      <div className="always-active-visual__header">
        <span className="always-active-visual__heading">General</span>
        <span className="always-active-visual__subtitle">Choose how Glissform stays available.</span>
      </div>
      <div className="always-active-visual__rows">
        {settings.map(([icon, title, description], index) => (
          <div className={`always-active-visual__row${index ? '' : ' always-active-visual__row--background'}`} key={icon}>
            <div className="always-active-visual__icon">
              <img src={`/assets/settings-preview/${icon}.svg`} width="25.059" height="25.059" alt="" />
            </div>
            <div className="always-active-visual__copy">
              <span className="always-active-visual__label">{title}</span>
              <span className="always-active-visual__description">{description}</span>
            </div>
            <div className="always-active-visual__switch"><span /></div>
          </div>
        ))}
      </div>
    </div>
    <FeatureCursor className="always-active-visual__cursor" />
  </div>;
}
