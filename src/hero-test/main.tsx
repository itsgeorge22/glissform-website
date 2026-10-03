import { useRef, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import DownloadLink from '../DownloadLink';
import { downloadUrl, siteUrl } from '../siteMetadata';
import logo from './assets/glissform.webp';
import notch from './assets/notch.svg';
import MenuBar from './MenuBar';
import HeroNavigation from './HeroNavigation';
import HeroStarField from './HeroStarField';
import '../styles.scss';
import './hero-test.scss';

const previewDownloadUrl = new URL(downloadUrl, siteUrl).href;
const desktopViewport = window.matchMedia('(min-width: 1156px)');
const subscribeToViewport = (onChange: () => void) => {
  desktopViewport.addEventListener('change', onChange);
  return () => desktopViewport.removeEventListener('change', onChange);
};

function HeroPreview() {
  const isDesktop = useSyncExternalStore(subscribeToViewport, () => desktopViewport.matches);
  if (isDesktop) return <HeroTest />;
  return <main className="hero-test-placeholder">
    <img src={logo} width="48" height="48" alt="Glissform" />
    <h1>A little more room, please.</h1>
    <p>Open this preview on your MacBook or widen your browser window to view the desktop design.</p>
  </main>;
}

function HeroTest() {
  const surfaceRef = useRef<HTMLElement>(null);
  return <main ref={surfaceRef} className="hero-test" aria-labelledby="hero-test-title">
    <div className="hero-test__screen">
      <div className="hero-test__atmosphere" aria-hidden="true">
        <div className="hero-test__glow hero-test__glow--blue" />
        <div className="hero-test__glow hero-test__glow--violet" />
        <div className="hero-test__glow hero-test__glow--teal" />
        <HeroStarField surfaceRef={surfaceRef} />
      </div>

      <MenuBar />

      <div className="hero-test__offer">
        <div className="hero-test__intro">
          <div className="hero-test__brand">
            <img src={logo} width="28" height="28" alt="" />
            <span>Glissform</span>
          </div>
          <div className="hero-test__copy">
            <h1 id="hero-test-title">Your Lid Moves.<br />Desktop Stays In Place</h1>
            <p><span>An iPhone Duo-style animation for your MacBook.</span>{' '}<span>Perspective, blur and shadow follow the lid as it closes.</span></p>
          </div>
        </div>
        <DownloadLink href={previewDownloadUrl} />
      </div>
    </div>

    <div className="hero-test__frame" aria-hidden="true" />
    <img className="hero-test__notch" src={notch} width="214" height="42" alt="" aria-hidden="true" />

    <HeroNavigation downloadHref={previewDownloadUrl} />
  </main>;
}

createRoot(document.getElementById('root')!).render(<HeroPreview />);
