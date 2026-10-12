import { useLayoutEffect, useRef } from 'react';
import { FeatureCursor } from './FeatureCursor';
import { FeatureMenuBar, FeatureWallpaper } from './FeatureDesktop';
import { animateEasyToReach } from './easyToReachMotion';
import './easy-to-reach-visual.scss';

const items = [
  { label: 'Ready', separator: true },
  { label: 'Enable Seamless Close', checked: true },
  { label: 'Settings...', shortcut: ',' },
  { label: 'Check for Updates...', separator: true },
  { label: 'Quit Glissform', shortcut: 'Q' },
];

export function EasyToReachVisual() {
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateEasyToReach(visual.current!), []);

  return <div className="easy-to-reach-visual" ref={visual}>
    <div className="easy-to-reach-visual__desktop">
      <FeatureWallpaper />
      <FeatureMenuBar>
        <div className="easy-to-reach-visual__menu">
          {items.map(({ label, checked, shortcut, separator }) => <div key={label}>
            <div className="easy-to-reach-visual__row">
              <span className="easy-to-reach-visual__symbol">{checked ? '✓' : ''}</span>
              <span className="easy-to-reach-visual__label">{label}</span>
              {shortcut && <span className="easy-to-reach-visual__shortcut">⌘ {shortcut}</span>}
            </div>
            {separator && <div className="easy-to-reach-visual__separator"><span /></div>}
          </div>)}
        </div>
      </FeatureMenuBar>
    </div>
    <FeatureCursor />
  </div>;
}
