import type { ReactNode } from 'react';
import { useLocalClock } from './localClock';
import './feature-desktop.scss';

export function FeatureWallpaper() {
  return <div className="feature-desktop-wallpaper">
    <img src="/assets/easy-to-reach/desktop.png" width="3840" height="2486" alt="" />
  </div>;
}

export function FeatureMenuBar({ children }: { children?: ReactNode }) {
  const clock = useLocalClock();
  return <div className="feature-menu-bar">
    <div className="feature-menu-bar__app"><span />{children}</div>
    <div className="feature-menu-bar__controls">
      <img src="/assets/easy-to-reach/control-center.svg" width="24.7202" height="25.213" alt="" />
    </div>
    <time className="feature-menu-bar__clock" dateTime={clock?.dateTime}>
      <span>{clock?.date}</span><span>{clock?.time}</span>
    </time>
  </div>;
}
