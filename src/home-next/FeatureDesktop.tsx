import type { ReactNode } from 'react';
import wallpaper960 from '../generated/assets/feature-wallpaper-960.webp?url';
import wallpaper1920 from '../generated/assets/feature-wallpaper-1920.webp?url';
import wallpaper2880 from '../generated/assets/feature-wallpaper-2880.webp?url';
import wallpaper3840 from '../generated/assets/feature-wallpaper-3840.webp?url';
import { useLocalClock } from './localClock';
import './feature-desktop.scss';

export function FeatureWallpaper() {
  return <div className="feature-desktop-wallpaper">
    <img
      src={wallpaper1920}
      srcSet={`${wallpaper960} 960w, ${wallpaper1920} 1920w, ${wallpaper2880} 2880w, ${wallpaper3840} 3840w`}
      // The shared wallpaper reaches 4.1 times the panel width at full demo zoom.
      sizes="(min-width: 1200px) 149vw, (min-width: 768px) calc(205vw - 197px), min(2624px, calc(410vw - 164px))"
      width="4480" height="3088" loading="lazy" decoding="async" alt=""
    />
  </div>;
}

export function FeatureMenuBar({ children }: { children?: ReactNode }) {
  const clock = useLocalClock();
  return <div className="feature-menu-bar">
    <div className="feature-menu-bar__app"><span />{children}</div>
    <div className="feature-menu-bar__controls">
      <img src={`${import.meta.env.BASE_URL}assets/easy-to-reach/control-center.svg`} width="24.7202" height="25.213" alt="" />
    </div>
    <time className="feature-menu-bar__clock" dateTime={clock?.dateTime}>
      <span>{clock?.date}</span><span>{clock?.time}</span>
    </time>
  </div>;
}
