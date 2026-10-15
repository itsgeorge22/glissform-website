import { AlwaysActiveVisual } from './AlwaysActiveVisual';
import { EasyToReachVisual } from './EasyToReachVisual';
import { StartAtLoginVisual } from './StartAtLoginVisual';
import { StayUpdatedVisual } from './StayUpdatedVisual';
import './settings-features.scss';

const features = [
  {
    id: 'start-at-login',
    icon: 'login',
    visualLeft: false,
    title: 'Start at login',
    lines: ['Launch Glissform when you sign in to your Mac,', 'with your saved animation settings.'],
  },
  {
    id: 'always-active',
    icon: 'background',
    visualLeft: true,
    title: 'Stay active',
    lines: ['Keep animations running after closing the app', 'with Run in background enabled.'],
  },
  {
    id: 'easy-to-reach',
    icon: 'menubar',
    visualLeft: false,
    title: 'Menu bar access',
    lines: ['Open Settings from the macOS menu bar', 'whenever you want to adjust an effect.'],
  },
  {
    id: 'stay-updated',
    icon: 'updates',
    visualLeft: true,
    title: 'Stay updated',
    lines: ['Enable automatic updates or install new', 'Glissform versions right inside the app.'],
  },
];

export default function SettingsFeatures() {
  return <section className="settings-features home-next-desktop" aria-label="Everyday conveniences">
    <div className="settings-features__stage" id="how-it-works">
      {features.map(({ id, icon, title, lines, visualLeft }) => (
        <article className={`settings-features__item${visualLeft ? ' settings-features__item--visual-left' : ''}`} key={id} aria-labelledby={id}>
          <div className="settings-features__copy">
            <div className="settings-features__icon-slot">
              <img className="settings-features__icon" src={`${import.meta.env.BASE_URL}assets/feature-icons/${icon}.svg`} width="40" height="40" alt="" />
            </div>
            <div className="settings-features__text">
              <h2 className="settings-features__title" id={id}>{title}</h2>
              <p className="settings-features__description">{lines.join(' ')}</p>
            </div>
          </div>
          <div className={`settings-features__panel settings-features__panel--${id}`} aria-hidden="true">
            {id === 'start-at-login' && <StartAtLoginVisual />}
            {id === 'always-active' && <AlwaysActiveVisual />}
            {id === 'easy-to-reach' && <EasyToReachVisual />}
            {id === 'stay-updated' && <StayUpdatedVisual />}
          </div>
        </article>
      ))}
    </div>
  </section>;
}
