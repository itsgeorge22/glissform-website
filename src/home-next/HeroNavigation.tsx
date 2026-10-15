import { logoSource, logoSources } from './logoImages';
import GlassDownloadLink from '../GlassDownloadLink';
import { navigationSections, navigationHref } from './sectionNavigation';

/** Shared navigation for the projected hero and fixed top bar. */
export default function AnimationHeroNavigation({ downloadHref, flat = false, onHomePage = true }: { downloadHref: string; flat?: boolean; onHomePage?: boolean }) {
  return <nav className="hero-test__nav" aria-label="Website navigation">
    <div className="hero-test__nav-dock" style={flat ? {
      // Preserve the standard property alongside the Safari form; the CSS
      // optimizer currently keeps only the prefixed form in the shared sheet.
      backdropFilter: 'blur(calc(24 * var(--design-unit, 1px))) saturate(135%)',
      WebkitBackdropFilter: 'blur(calc(24 * var(--design-unit, 1px))) saturate(135%)',
    } : undefined}>
      <a className="hero-test__home" href={import.meta.env.BASE_URL} aria-label="Glissform home">
        <img src={logoSource} srcSet={logoSources} sizes="(min-width: 1200px) 1.666667vw, 32px"
          width="32" height="32" alt="" />
      </a>
      <span className="hero-test__nav-divider" aria-hidden="true" />
      <div className="hero-test__links">
        <span className="hero-test__active-link" aria-hidden="true" />
        {navigationSections.map(({ id, label }) => <a key={id} href={navigationHref(id, onHomePage)} data-section-link={id}><span>{label}</span></a>)}
      </div>
      <span className="hero-test__nav-divider" aria-hidden="true" />
      <div className="hero-test__download-slot">
        {flat ? <GlassDownloadLink href={downloadHref} label="Download" placement="fixed_navbar" /> : <a className="download-link download-link--secondary" href={downloadHref} data-download-placement="navbar">
          <span className="download-link__glass" aria-hidden="true"><span className="download-link__glint" /></span>
          <span className="download-link__label">Download</span>
        </a>}
      </div>
    </div>
  </nav>;
}
