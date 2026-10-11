import logo from '../hero-test/assets/glissform.webp?url';
import GlassDownloadLink from '../GlassDownloadLink';

/** The original navigation markup and materials, with its glass pointer handled
 * once by this page's projection-aware controller. Shared routes stay unchanged. */
export default function AnimationHeroNavigation({ downloadHref, flat = false }: { downloadHref: string; flat?: boolean }) {
  return <nav className="hero-test__nav" aria-label="Website navigation">
    <div className="hero-test__nav-motion">
    <div className="hero-test__nav-dock" style={flat ? {
      // Preserve the standard property alongside the Safari form; the CSS
      // optimizer currently keeps only the prefixed form in the shared sheet.
      backdropFilter: 'blur(24px) saturate(135%)', WebkitBackdropFilter: 'blur(24px) saturate(135%)',
    } : undefined}>
      <a className="hero-test__home" href="/" aria-label="Glissform home">
        <img src={logo} width="32" height="32" alt="" />
      </a>
      <span className="hero-test__nav-divider" aria-hidden="true" />
      <div className="hero-test__links">
        <a href="https://glissform.app/#customise"><span>Features</span></a>
        <a href="https://glissform.app/#privacy"><span>Privacy</span></a>
        <a href="https://glissform.app/#good-to-know"><span>FAQ</span></a>
      </div>
      <span className="hero-test__nav-divider" aria-hidden="true" />
      <div className="hero-test__download-slot">
        {flat ? <GlassDownloadLink href={downloadHref} label="Download" /> : <a className="download-link download-link--secondary" href={downloadHref}>
          <span className="download-link__glass" aria-hidden="true"><span className="download-link__glint" /></span>
          <span className="download-link__label">Download</span>
        </a>}
      </div>
    </div>
    </div>
  </nav>;
}
