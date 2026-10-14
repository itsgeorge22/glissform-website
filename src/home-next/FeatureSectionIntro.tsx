import type { ReactNode } from 'react';
import './feature-section-intro.scss';

type FeatureSectionIntroProps = {
  title: ReactNode;
  description: string;
  headingId?: string;
  className?: string;
};

export function FeatureSectionIntro({ title, description, headingId, className = '' }: FeatureSectionIntroProps) {
  return <header className={`feature-section-intro ${className}`}>
    <h2 id={headingId}>{title}</h2>
    <p>{description}</p>
  </header>;
}
