import { useEffect, type Ref } from 'react';
import AnimationHeroNavigation from './HeroNavigation';
import CompactNavigation from './CompactNavigation';
import { trackSectionNavigation } from './sectionNavigation';
import { downloadUrl, siteUrl } from '../siteMetadata';
import './fixed-navigation.scss';

interface Props {
  sceneControlled?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** The homepage supplies the entrance; other pages show the same dock immediately. */
export default function FixedNavigation({ sceneControlled = false, ref }: Props) {
  useEffect(() => sceneControlled ? undefined : trackSectionNavigation(), [sceneControlled]);

  return <>
    <div
      className={`fixed-navigation${sceneControlled ? ' hero-animation__navigation' : ''}`}
      ref={ref}
      aria-hidden={sceneControlled ? true : undefined}
      inert={sceneControlled ? true : undefined}
    >
      <AnimationHeroNavigation downloadHref={new URL(downloadUrl, siteUrl).href} flat onHomePage={sceneControlled} />
    </div>
    {!sceneControlled && <CompactNavigation fixed onHomePage={false} />}
  </>;
}
