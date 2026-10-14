import { useEffect, useRef } from 'react';
import { ManualAngleVisual } from './ManualAngleVisual';
import { AutomaticAngleVisual } from './AutomaticAngleVisual';
import { BlurVisual, DesktopReturnVisual } from './SeamlessFeatureVisuals';
import { FeatureSectionIntro } from './FeatureSectionIntro';
import { trackCustomizationCover } from './customizationScrollCover';
import './seamless-close-features.scss';

const features = [
  {
    id: 'manual-starting-angle',
    tone: 'blue',
    title: 'Manual starting angle',
    description: 'Choose the MacBook lid angle that starts the animation, from 20° to 130°, or use your current angle.',
  },
  {
    id: 'automatic-angle-detection',
    tone: 'purple',
    title: 'Automatic angle detection',
    description: 'Let Glissform learn your starting angle while the lid stays still, with a delay and minimum angle you choose.',
  },
  {
    id: 'adjustable-blur',
    tone: 'teal',
    title: 'Adjustable blur',
    description: 'Adjust the blur in your MacBook lid animation with High, Regular or Subtle presets, or turn it off.',
  },
  {
    id: 'resume-after-pause',
    tone: 'green',
    title: 'Resume after a pause',
    description: 'Hold your MacBook lid still to bring your desktop back after a pause, with a wait time you choose.',
  },
  {
    id: 'return-with-esc',
    tone: 'yellow',
    title: 'Return with Esc',
    description: 'Press Esc to return to your desktop during the lid animation, even when pause restoration is off.',
  },
  {
    id: 'connection-effect',
    tone: 'orange',
    title: 'Connection effect',
    description: 'Add a soft edge glow and a short click as your desktop returns. Switch both on or off together.',
  },
];

export default function SeamlessCloseFeatures() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (section) return trackCustomizationCover(section);
  }, []);

  return <section ref={sectionRef} className="seamless-close-features home-next-desktop" aria-label="Seamless Close features">
    <FeatureSectionIntro
      title="Make every close your own"
      description="Choose when Seamless Close starts, how it looks and how your desktop returns"
    />
    <div className="seamless-close-features__grid">
      {features.map(({ id, tone, title, description }) => (
        <article className="seamless-close-features__item" key={id} aria-labelledby={id}>
          <div className={`seamless-close-features__placeholder seamless-close-features__placeholder--${tone}`} aria-hidden="true">
            {id === 'manual-starting-angle' && <ManualAngleVisual />}
            {id === 'automatic-angle-detection' && <AutomaticAngleVisual />}
            {id === 'adjustable-blur' && <BlurVisual />}
            {id === 'resume-after-pause' && <DesktopReturnVisual mode="pause" />}
            {id === 'return-with-esc' && <DesktopReturnVisual mode="escape" />}
            {id === 'connection-effect' && <DesktopReturnVisual mode="connection" />}
          </div>
          <div className="seamless-close-features__copy">
            <h3 id={id}>{title}</h3>
            <p>{description}</p>
          </div>
        </article>
      ))}
    </div>
  </section>;
}
