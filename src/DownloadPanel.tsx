import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { asset, brandSrcSet } from './assets';
import ResponsiveBreak from './ResponsiveBreak';
import { connectStarField } from './starFieldInteraction';

const sparks = Array.from({ length: 40 }, (_, index) => ({
  left: `${4 + ((index * 37) % 92)}%`,
  top: `${20 + ((index * 23) % 70)}%`,
}));

export default function DownloadPanel({ children }: { children: ReactNode }) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    return connectStarField({ surface: panel, starSelector: '.download-panel__spark' });
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
      <p>Subtle animations and thoughtful details for your Mac.<ResponsiveBreak />Start with Seamless Close.</p>
    </div>
    {children}
  </section>;
}
