import { logoSource, logoSources } from './logoImages';

export default function GlissformBrand() {
  return <div className="hero-test__brand">
    <img src={logoSource} srcSet={logoSources} sizes="(min-width: 1200px) max(28px, 1.458334vw), 28px"
      width="28" height="28" alt="" />
    <span>Glissform</span>
  </div>;
}
