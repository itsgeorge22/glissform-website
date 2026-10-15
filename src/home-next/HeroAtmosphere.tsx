import type { RefObject } from 'react';
import AnimationHeroStarField from '../hero-test-animation/AnimationHeroStarField';
import HeroStarField from '../hero-test/HeroStarField';

export default function HeroAtmosphere({ surfaceRef, projected = false }: {
  surfaceRef: RefObject<HTMLElement | null>;
  projected?: boolean;
}) {
  return <div className="hero-test__atmosphere" aria-hidden="true">
    <div className="hero-prelude__glow">
      <div className="hero-test__glow hero-test__glow--blue" />
      <div className="hero-test__glow hero-test__glow--violet" />
      <div className="hero-test__glow hero-test__glow--teal" />
    </div>
    {projected
      ? <AnimationHeroStarField surfaceRef={surfaceRef} />
      : <HeroStarField surfaceRef={surfaceRef} compactFullField />}
  </div>;
}
