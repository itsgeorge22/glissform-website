import { useLayoutEffect, useRef } from 'react';
import { TextLine } from './TextReveal';
import { animateSettingsFeatures } from './settingsFeaturesMotion';
import './settings-features.scss';

const features = [
  {
    id: 'start-at-login',
    title: 'Start at login',
    lines: ['Let Glissform open when you sign in, ready', 'with your saved preferences.'],
  },
  {
    id: 'easy-to-reach',
    title: 'Easy to reach',
    lines: ['Open Settings from the menu bar', 'whenever you want to adjust an effect.'],
  },
  {
    id: 'always-active',
    title: 'Always active',
    lines: ['Keep effects active when Settings closes', 'with Run in background turned on.'],
  },
  {
    id: 'stay-updated',
    title: 'Stay updated',
    lines: ['Enable automatic updates or install new', 'versions right from inside the app.'],
  },
];

export default function SettingsFeatures() {
  const section = useRef<HTMLElement>(null);
  useLayoutEffect(() => animateSettingsFeatures(section.current!), []);

  return <section className="settings-features home-next-desktop" ref={section} aria-label="Everyday conveniences">
    <div className="settings-features__stage">
      {features.map(({ id, title, lines }) => (
        <article className="settings-features__item" key={id} aria-labelledby={id}>
          {/* Keep every message in reading order independently of visual playback. */}
          <div className="settings-features__accessible-copy">
            <h2 id={id}>{title}</h2>
            <p>{lines.join(' ')}</p>
          </div>
          <div className="settings-features__copy" aria-hidden="true">
            <div className="settings-features__title"><TextLine text={title} /></div>
            <p className="settings-features__description">{lines.map((text, index) => <TextLine text={text} key={index} />)}</p>
          </div>
          <div className="settings-features__panel" aria-hidden="true" />
        </article>
      ))}
    </div>
  </section>;
}
