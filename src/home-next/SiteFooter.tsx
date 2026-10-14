import { useRef } from 'react';
import DownloadLink from '../DownloadLink';
import { downloadUrl, siteUrl } from '../siteMetadata';
import GlissformBrand from './GlissformBrand';
import HeroAtmosphere from './HeroAtmosphere';
import './site-footer.scss';

export default function SiteFooter() {
  const cardRef = useRef<HTMLElement>(null);

  return <footer className="home-footer">
    <section className="home-footer__card" ref={cardRef} aria-labelledby="footer-download-title">
      <div className="hero-test__screen home-footer__surface">
        <HeroAtmosphere surfaceRef={cardRef} />
        <div className="hero-test__offer home-footer__offer">
          <div className="home-footer__copy">
            <h2 id="footer-download-title">A little more magic</h2>
            <p>Make closing your Mac even more satisfying</p>
          </div>
          <div className="hero-download">
            <DownloadLink href={new URL(downloadUrl, siteUrl).href} />
          </div>
        </div>
      </div>
    </section>
    <div className="home-footer__bottom">
      <a className="home-footer__home" href="#" aria-label="Glissform home"><GlissformBrand /></a>
      <p>© {new Date().getFullYear()} Glissform</p>
    </div>
  </footer>;
}
