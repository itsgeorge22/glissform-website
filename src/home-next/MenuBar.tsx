import { useLocalClock } from './localClock';
import menuBar from '../hero-test/assets/menu-bar.svg?url';

function LocalClock() {
  const clock = useLocalClock();
  // Keep the same time element as the first local clock value arrives.
  if (!clock) return <time className="hero-test__menu-clock" />;

  return <time className="hero-test__menu-clock" dateTime={clock.dateTime}>
    <span>{clock.date}</span><span>{clock.time}</span>
  </time>;
}

export default function MenuBar() {
  return <div className="hero-test__menu" aria-hidden="true">
    <div className="hero-test__menu-group">
      <span className="hero-test__menu-icon hero-test__menu-icon--apple"><img src={menuBar} width="1888" height="48" alt="" /></span>
      <span className="hero-test__menu-label hero-test__menu-app">Glissform</span>
      <span className="hero-test__menu-label">Edit</span>
      <span className="hero-test__menu-label">Window</span>
    </div>
    <div className="hero-test__menu-group">
      <span className="hero-test__menu-icon hero-test__menu-icon--wifi"><img src={menuBar} width="1888" height="48" alt="" /></span>
      <span className="hero-test__menu-icon hero-test__menu-icon--controls"><img src={menuBar} width="1888" height="48" alt="" /></span>
      <LocalClock />
    </div>
  </div>;
}
