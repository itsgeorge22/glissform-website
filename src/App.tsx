import { useEffect, useState, type CSSProperties } from 'react';
import SeamlessCloseSection from './SeamlessCloseSection';
import DownloadPanel from './DownloadPanel';
import GlassDownloadLink from './GlassDownloadLink';
import FutureField from './FutureField';

const asset = (name: string) => '/assets/' + name;
const downloadUrl = '/downloads/Glissform-0.1.0-beta.5.dmg';

function Brand({ homeLink = false }: { homeLink?: boolean }) {
  const icon = homeLink ? 'navbar-glissform-icon.png' : 'glissform-icon.png';
  const content = <><img src={asset(icon)} width="32" height="32" alt="" /><span>Glissform</span></>;
  return homeLink
    ? <a className="brand brand--link" href="#" aria-label="Glissform — back to top">{content}</a>
    : <span className="brand">{content}</span>;
}

function DownloadLink({ secondary = false }: { secondary?: boolean }) {
  if (secondary) return <GlassDownloadLink href={downloadUrl} />;
  return <a className={secondary ? 'download-link download-link--secondary' : 'download-link'} href={downloadUrl}>
    {secondary && <img src={asset('download.svg')} width="24" height="24" alt="" />}
    <span>{secondary ? 'Download for Mac' : 'Download Glissform'}</span>
  </a>;
}

const sectionLinks = [
  { id: 'customise', label: 'Customisable' },
  { id: 'privacy', label: 'Private' },
  { id: 'good-to-know', label: 'F.A.Q' },
];

function SectionNavigation() {
  const [activeSection, setActiveSection] = useState(() => window.location.hash.slice(1));

  useEffect(() => {
    let animationFrame = 0;

    const updateActiveSection = () => {
      if (window.scrollY <= 0) {
        setActiveSection('');
        return;
      }

      const viewportTop = 72;
      const viewportBottom = window.innerHeight;
      let nextSection = '';
      let largestVisibleArea = 0;

      sectionLinks.forEach(({ id }) => {
        const section = document.getElementById(id);
        if (!section) return;
        const bounds = section.getBoundingClientRect();
        const visibleArea = Math.max(0, Math.min(bounds.bottom, viewportBottom) - Math.max(bounds.top, viewportTop));
        if (visibleArea > largestVisibleArea) {
          largestVisibleArea = visibleArea;
          nextSection = id;
        }
      });

      setActiveSection(nextSection);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    const updateFromHash = () => {
      const hashSection = window.location.hash.slice(1);
      if (sectionLinks.some(({ id }) => id === hashSection)) setActiveSection(hashSection);
      else scheduleUpdate();
    };

    updateActiveSection();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('hashchange', updateFromHash);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('hashchange', updateFromHash);
    };
  }, []);

  return <nav className="site-nav" aria-label="Main sections">
    {sectionLinks.map(({ id, label }) => <a key={id} className="site-nav__link" href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}
  </nav>;
}

function SiteHeader() {
  const [hasMaterial, setHasMaterial] = useState(() => window.scrollY > 0);

  useEffect(() => {
    const updateHeader = () => setHasMaterial(window.scrollY > 0);
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  return <header className={'site-header shell' + (hasMaterial ? ' site-header--material' : '')}>
    <Brand homeLink />
    <SectionNavigation />
    <DownloadLink secondary />
  </header>;
}

function SectionIntro({ title, copy }: { title: [string, string]; copy: [string, string] }) {
  return <div className="section-intro">
    <h2>{title[0]}<br />{title[1]}</h2>
    <p>{copy[0]}<br />{copy[1]}</p>
  </div>;
}

function IllustrationSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button className="illustration-switch" type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}><span /></button>;
}

function SettingRow({ label, switchValue, onSwitch, value, muted = false }: { label: string; switchValue?: boolean; onSwitch?: (checked: boolean) => void; value?: string; muted?: boolean }) {
  return <div className={'setting-row' + (muted ? ' setting-row--muted' : '')}><span>{label}</span>{switchValue !== undefined && onSwitch
    ? <IllustrationSwitch label={label} checked={switchValue} onChange={onSwitch} />
    : <strong>{value}</strong>}</div>;
}

function CustomizationGrid() {
  const [blur, setBlur] = useState<'high' | 'regular' | 'subtle'>('regular');
  const [angle, setAngle] = useState(100);
  const [detectAngle, setDetectAngle] = useState(true);
  const [pauseReturn, setPauseReturn] = useState(true);
  const [powerConnection, setPowerConnection] = useState(true);
  const [batteryLow, setBatteryLow] = useState(true);
  const blurChoices = [
    { id: 'high', label: 'High', image: 'blur-high.png' },
    { id: 'regular', label: 'Regular', image: 'blur-regular.png' },
    { id: 'subtle', label: 'Subtle', image: 'blur-subtle.png' },
  ] as const;

  return <div className="customization-grid">
    <article className="content-card blur-card">
      <div className="card-copy"><h3>Blur that feels right</h3><p>Choose Subtle, Regular or High blur, or switch it off.</p></div>
      <div className="blur-choices" aria-label="Blur strength">
        {blurChoices.map((choice) => <button className={'blur-choice' + (blur === choice.id ? ' blur-choice--selected' : '')} type="button" aria-pressed={blur === choice.id} onClick={() => setBlur(choice.id)} key={choice.id}><span className="blur-choice__image"><img src={asset(choice.image)} alt="" /></span><span>{choice.label}</span></button>)}
      </div>
    </article>
    <article className="content-card angle-card">
      <div className="card-copy"><h3>Choose your<br />starting angle</h3><p>Set the lid angle that starts Seamless Close, or use the current angle.</p></div>
      <div className="angle-illustration">
        <div className="angle-illustration__value"><label htmlFor="starting-angle">Begin at</label><strong>{angle}°</strong></div>
        <input id="starting-angle" className="angle-illustration__range" type="range" min="60" max="120" step="1" value={angle} aria-valuetext={`${angle} degrees`} onChange={(event) => setAngle(Number(event.target.value))} style={{ '--angle-progress': `${(angle - 60) / 60 * 100}%` } as CSSProperties} />
      </div>
    </article>
    <article className="content-card settings-card">
      <div className="card-copy"><h3>Let your lid<br />set the angle</h3><p>Hold the lid still to set a starting angle. Choose how long to wait.</p></div>
      <div className="settings-card__rows"><SettingRow label="Detect starting angle" switchValue={detectAngle} onSwitch={setDetectAngle} /><SettingRow label="Wait time" value="1.0 s" muted={!detectAngle} /></div>
    </article>
    <article className="content-card settings-card">
      <div className="card-copy"><h3>Pause to return<br />to your desktop</h3><p>Hold the lid still during the effect to restore your desktop after a delay.</p></div>
      <div className="settings-card__rows"><SettingRow label="Pause to return" switchValue={pauseReturn} onSwitch={setPauseReturn} /><SettingRow label="Wait time" value="0.5 s" muted={!pauseReturn} /></div>
    </article>
    <article className="content-card settings-card">
      <div className="card-copy"><h3>Choose your<br />battery ripples</h3><p>Choose each battery alert separately. Preview both in the app.</p></div>
      <div className="settings-card__rows"><SettingRow label="Power connection" switchValue={powerConnection} onSwitch={setPowerConnection} /><SettingRow label="Battery at 20%" switchValue={batteryLow} onSwitch={setBatteryLow} /></div>
    </article>
  </div>;
}

function FeatureShowcase() {
  const [selected, setSelected] = useState<'seamless' | 'battery'>('seamless');
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSelected(current => current === 'seamless' ? 'battery' : 'seamless'), 10000);
    return () => window.clearTimeout(timeout);
  }, [selected, cycle]);

  const selectFeature = (feature: 'seamless' | 'battery') => {
    setSelected(feature);
    setCycle(current => current + 1);
  };

  return <div className="feature-showcase" aria-label="Feature previews">
    <div className="feature-selector">
      <article className={'feature-option' + (selected === 'seamless' ? ' feature-option--selected' : '')}>
        {selected === 'seamless' && <span key={`seamless-${cycle}`} className="feature-option__progress" aria-hidden="true" />}
        <div className="feature-option__copy">
          <div className="feature-option__title">
            <span className="feature-icon feature-icon--seamless"><img src={asset('seamless-close.svg')} width="24" height="24" alt="" /></span>
            <h2>Seamless Close</h2>
          </div>
          <p>Your desktop appears to stay in place as you close your MacBook.</p>
        </div>
        <button className="feature-option__control" type="button" aria-label="Show Seamless Close preview" aria-pressed={selected === 'seamless'} aria-controls="feature-preview" onClick={() => selectFeature('seamless')} />
      </article>
      <article className={'feature-option' + (selected === 'battery' ? ' feature-option--selected' : '')}>
        {selected === 'battery' && <span key={`battery-${cycle}`} className="feature-option__progress" aria-hidden="true" />}
        <div className="feature-option__copy">
          <div className="feature-option__title">
            <span className="feature-icon feature-icon--battery"><img src={asset('battery-ripple.svg')} width="24" height="24" alt="" /></span>
            <h2>Battery Ripple</h2>
          </div>
          <p>A green ripple when power connects.<br />A red ripple at 20% battery.</p>
        </div>
        <button className="feature-option__control" type="button" aria-label="Show Battery Ripple preview" aria-pressed={selected === 'battery'} aria-controls="feature-preview" onClick={() => selectFeature('battery')} />
      </article>
    </div>
    <div className="feature-preview" id="feature-preview">
      <div className={'feature-preview__screen' + (selected === 'seamless' ? ' feature-preview__screen--active' : '')} aria-hidden={selected !== 'seamless'}>
        <img src={asset('seamless-settings.png')} alt="Still preview of Seamless Close settings in Glissform" />
      </div>
      <div className={'feature-preview__screen feature-preview__screen--battery' + (selected === 'battery' ? ' feature-preview__screen--active' : '')} aria-hidden={selected !== 'battery'}>
        <img src={asset('battery-settings.png')} alt="Still preview of Battery Ripple settings in Glissform" />
      </div>
      <div className="feature-preview__fade" aria-hidden="true" />
    </div>
  </div>;
}

const conveniences = [
  { icon: 'login.svg', title: 'Start at login', copy: 'Let Glissform open when you sign in, ready with your saved preferences.' },
  { icon: 'menubar.svg', title: 'Settings, close by', copy: 'Open Settings from the menu bar whenever you want to adjust an effect.' },
  { icon: 'background.svg', title: 'Keep effects ready', copy: 'Keep effects active when Settings closes with Run in background.' },
  { icon: 'updates.svg', title: 'Update your way', copy: 'Enable automatic updates or install new versions from inside the app.' },
];

const faq = [
  { question: 'Will it work on my MacBook?', answer: 'Glissform requires macOS 15 or later. Seamless Close also needs a compatible lid-angle sensor. Tested on a MacBook Air M5 15-inch; other models are not yet verified.' },
  { question: 'Why does it need Screen Recording access?', answer: 'macOS calls this permission Screen Recording. Seamless Close uses it for individual desktop screenshots, not continuous recording. Images stay on your Mac. Battery Ripple needs no screen access.' },
  { question: 'Does it change sleep or the Lock Screen?', answer: 'Normal sleep stays enabled, and there is no Lock Screen animation. Before sleep, reopening the lid reverses the effect.' },
  { question: 'How do updates work?', answer: 'With Automatic updates enabled, new versions download in the background and install when you quit, when macOS allows. Otherwise, use the in-app Update button.' },
];

function App() {
  return <>
    <div className="desktop-site">
      <SiteHeader />
      <main>
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero__content">
            <h1 id="hero-title">Beautifully Polished<br />Everyday Mac Moments</h1>
            <p>Subtle animations and thoughtful improvements<br />for the way you use your MacBook.</p>
            <DownloadLink />
          </div>
          <FeatureShowcase />
        </section>

        <SeamlessCloseSection />

        <section className="section section--personalization shell" id="customise" aria-label="Personalization">
          <SectionIntro title={['Make Each Moment', 'Feel More Like Yours']} copy={['Adjust how Seamless Close looks and when it begins.', 'Choose which battery ripples you want to see.']} />
          <CustomizationGrid />
        </section>

        <section className="section section--conveniences shell" id="everyday" aria-label="Everyday controls">
          <SectionIntro title={['Feels At Home', 'And Stays Out Of Your Way']} copy={['Set Glissform to open at login, keep running when Settings closes,', 'and update the way you prefer.']} />
          <div className="conveniences-grid">
            {conveniences.map((item) => <article className="convenience" key={item.icon}><img src={asset(item.icon)} width="32" height="32" alt="" /><h3>{item.title}</h3><p>{item.copy}</p></article>)}
          </div>
        </section>

        <section className="privacy-panel shell" id="privacy" aria-labelledby="privacy-title">
          <div className="privacy-panel__intro"><span className="privacy-panel__icon"><img src={asset('privacy-shield.svg')} width="34" height="40" alt="" /></span><h2 id="privacy-title">Your Screen<br />Stays Private</h2><p>Seamless Close uses a temporary image of your desktop. That image stays on your Mac.</p></div>
          <div className="privacy-panel__facts">
            <div><h3>No continuous recording</h3><p>One temporary screenshot powers each gesture.</p></div>
            <div><h3>Never saved or shared</h3><p>Screen images stay in memory. They are never saved or sent.</p></div>
            <div><h3>No analytics</h3><p>The app connects to this site for update checks and downloads.</p></div>
          </div>
        </section>

        <section className="section section--future shell" id="more-to-come" aria-label="More to come">
          <SectionIntro title={['More Thoughtful Touches', 'For Everyday Mac Moments']} copy={['Seamless Close and Battery Ripple are available now.', 'We’re building on these with more thoughtful additions for your Mac.']} />
          <FutureField />
        </section>

        <section className="section section--faq shell" id="good-to-know" aria-labelledby="faq-title">
          <div className="faq-intro"><h2 id="faq-title">Before<br />You Try It</h2><p>Requirements, permissions and a few useful details about the beta.</p></div>
          <div className="faq-list">
            {faq.map((item) => <div className="faq-item" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
            <div className="faq-item"><h3>How do I install the beta?</h3><p>Open the DMG and drag Glissform to Applications. The beta is not Apple notarized. If macOS blocks the first launch, go to System Settings → Privacy &amp; Security → Open Anyway, if you trust the download.</p></div>
          </div>
        </section>

        <DownloadPanel><DownloadLink /></DownloadPanel>
      </main>
      <footer className="site-footer shell"><Brand /><span>© 2026 Glissform</span></footer>
    </div>
    <div className="small-screen"><Brand /><p>Glissform is a macOS app.<br />Please use a MacBook to view this website.</p></div>
  </>;
}

export default App;
