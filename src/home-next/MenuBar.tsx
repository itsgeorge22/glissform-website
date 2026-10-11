import { useEffect, useState } from 'react';
import menuBar from '../hero-test/assets/menu-bar.svg?url';

function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer = 0;
    const refresh = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      const current = new Date();
      setNow(current);
      // Align updates with the device's minute boundary, including after wake.
      timer = window.setTimeout(refresh, 60_000 - (current.getTime() % 60_000));
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Keep the same time element as the first local clock value arrives.
  if (!now) return <time className="hero-test__menu-clock" />;

  const date = new Intl.DateTimeFormat(navigator.language, {
    weekday: 'short', month: 'short', day: 'numeric',
  }).formatToParts(now).map(part => part.type === 'day' ? `${part.value}.` : part.value).join('');
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(now);

  return <time className="hero-test__menu-clock" dateTime={now.toISOString()}>
    <span>{date}</span><span>{time}</span>
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
