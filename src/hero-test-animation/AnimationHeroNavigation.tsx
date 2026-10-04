import logo from '../hero-test/assets/glissform.webp';

/** The original navigation markup and materials, with its glass pointer handled
 * once by this page's projection-aware controller. Shared routes stay unchanged. */
export default function AnimationHeroNavigation({ downloadHref }: { downloadHref: string }) {
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
        <a className="download-link download-link--secondary" href={downloadHref}>
          <span className="download-link__glass" aria-hidden="true"><span className="download-link__glint" /></span>
          <span className="download-link__label">Download</span>
        </a>
      </div>
    </div>
  </nav>;
}
