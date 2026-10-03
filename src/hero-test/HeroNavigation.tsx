import GlassDownloadLink from '../GlassDownloadLink';
import logo from './assets/glissform.webp';

export default function HeroNavigation({ downloadHref }: { downloadHref: string }) {
  return <nav className="hero-test__nav" aria-label="Website navigation">
    <div className="hero-test__nav-dock">
      <a className="hero-test__home" href="/" aria-label="Glissform home">
        <img src={logo} width="32" height="32" alt="" />
      </a>
      <span className="hero-test__nav-divider" aria-hidden="true" />
      <div className="hero-test__links">
        <a href="/#customise"><span>Features</span></a>
        <a href="/#privacy"><span>Privacy</span></a>
        <a href="/#good-to-know"><span>FAQ</span></a>
      </div>
      <span className="hero-test__nav-divider" aria-hidden="true" />
      <div className="hero-test__download-slot">
        <GlassDownloadLink href={downloadHref} label="Download" />
      </div>
    </div>
  </nav>;
}
