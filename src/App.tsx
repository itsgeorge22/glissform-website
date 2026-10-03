import { useEffect, useRef, useState } from 'react';
import SeamlessCloseSection from './SeamlessCloseSection';
import DownloadPanel from './DownloadPanel';
import GlassDownloadLink from './GlassDownloadLink';
import { asset, brandSrcSet } from './assets';
import SeamlessFeatures from './SeamlessFeatures';
import './features.scss';
import ResponsiveBreak from './ResponsiveBreak';
import { downloadUrl } from './siteMetadata';

function Brand({ homeLink = false }: { homeLink?: boolean }) {
  const icon = homeLink ? 'navbar-glissform-icon.png' : 'glissform-icon.png';
  const content = <><img src={asset(icon)} srcSet={brandSrcSet(homeLink)} sizes="32px" width="32" height="32" alt="" /><span>Glissform</span></>;
  return homeLink
    ? <a className="brand brand--link" href="#" aria-label="Glissform — back to top">{content}</a>
    : <span className="brand">{content}</span>;
}

function DownloadLink({ secondary = false }: { secondary?: boolean }) {
  if (secondary) return <GlassDownloadLink href={downloadUrl} />;
  return <a className={secondary ? 'download-link download-link--secondary' : 'download-link'} href={downloadUrl}>
    {secondary && <img src={asset('download.svg')} width="24" height="24" alt="" />}
    <span>Download Glissform</span>
  </a>;
}

const sectionLinks = [
  { id: 'customise', label: 'Features' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'good-to-know', label: 'F.A.Q' },
];

function SectionNavigation({ onNavigate }: { onNavigate: () => void }) {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const section = sectionLinks.find(({ id }) => hash === `#${id}`);
    const target = section && document.getElementById(section.id);
    const main = document.querySelector('main');
    if (!target || !main) return;
    let frame = 0;
    let stopped = false;
    const restoreAnchor = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (stopped || window.location.hash !== hash) return;
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    };
    // Fonts and the animated track can settle after the browser's first jump.
    // Stop following the initial anchor as soon as the visitor takes control.
    const observer = new ResizeObserver(restoreAnchor);
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'hashchange', 'resize'];
    const stop = () => {
      stopped = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      events.forEach(event => window.removeEventListener(event, stop));
    };
    observer.observe(main);
    events.forEach(event => window.addEventListener(event, stop, { passive: true }));
    void document.fonts.ready.then(restoreAnchor);
    restoreAnchor();
    return stop;
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    const updateActiveSection = () => {
      if (window.scrollY <= 0) {
        setActiveSection('');
        return;
      }

      const viewportTop = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 72;
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

  return <nav id="main-sections" className="site-nav" aria-label="Main sections">
    {sectionLinks.map(({ id, label }) => <a key={id} className="site-nav__link" href={`#${id}`} onClick={onNavigate} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}
  </nav>;
}

function SiteHeader() {
  const [hasMaterial, setHasMaterial] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateHeader = () => setHasMaterial(window.scrollY > 0);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const desktop = window.matchMedia('(min-width: 769px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  return <header ref={headerRef} className={'site-header shell' + (hasMaterial ? ' site-header--material' : '') + (menuOpen ? ' site-header--menu-open' : '')} onClick={(event) => {
    if (event.target instanceof Element && event.target.closest('.brand--link')) setMenuOpen(false);
  }}>
    <Brand homeLink />
    <button ref={menuButtonRef} className="site-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="main-sections" onClick={() => setMenuOpen(open => !open)}>
      <span aria-hidden="true" /><span aria-hidden="true" />
    </button>
    <SectionNavigation onNavigate={() => setMenuOpen(false)} />
    <DownloadLink secondary />
  </header>;
}

function SectionIntro({ title, copy }: { title: [string, string]; copy: [string, string] }) {
  return <div className="section-intro">
    <h2>{title[0]}<ResponsiveBreak />{title[1]}</h2>
    <p>{copy[0]}<ResponsiveBreak />{copy[1]}</p>
  </div>;
}

const conveniences = [
  { icon: 'login.svg', title: 'Start at login', copy: 'Let Glissform open when you sign in, ready with your saved preferences.' },
  { icon: 'menubar.svg', title: 'Settings, close by', copy: 'Open Settings from the menu bar whenever you want to adjust an effect.' },
  { icon: 'background.svg', title: 'Keep effects ready', copy: 'Keep effects active when Settings closes with Run in background.' },
  { icon: 'updates.svg', title: 'Update your way', copy: 'Enable automatic updates or install new versions from inside the app.' },
];

const faq = [
  { question: 'Is Glissform free?', answer: 'Yes. Glissform is fully free to use. Download the app and enjoy Seamless Close on a compatible MacBook.' },
  { question: 'Can I get an iPhone Duo-style animation on my MacBook?', answer: 'Seamless Close brings a similar visual effect to compatible MacBooks: perspective, blur and shadow follow the lid as it closes, making your desktop appear to stay in place. It is a Glissform feature, not an Apple feature or an exact recreation. Normal system sleep stays enabled, and there is no Lock Screen animation.' },
  { question: 'Will it work on my MacBook?', answer: 'Glissform requires macOS 15 or later. Seamless Close also needs a compatible lid-angle sensor. Tested on a MacBook Air M5 15-inch; other models are not yet verified.' },
  { question: 'Why does it need Screen Recording access?', answer: 'macOS calls this permission Screen Recording. Seamless Close uses it for individual desktop screenshots, not continuous recording. Images stay on your Mac.' },
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
            <h1 id="hero-title">Your Lid Moves While<ResponsiveBreak />Your Desktop Stays In Place</h1>
            <p>An iPhone Duo-style animation for your MacBook.<ResponsiveBreak />Perspective, blur and shadow follow the lid as it closes.</p>
            <DownloadLink />
          </div>
        </section>

        <SeamlessCloseSection />

        <SeamlessFeatures />

        <section className="section section--conveniences shell" id="everyday" aria-label="Everyday controls">
          <SectionIntro title={['Feels At Home', 'And Stays Out Of Your Way']} copy={['Set Glissform to open at login, keep running when Settings closes,', 'and update the way you prefer.']} />
          <div className="conveniences-grid">
            {conveniences.map((item) => <article className="convenience" key={item.icon}><img src={asset(item.icon)} width="32" height="32" alt="" /><h3>{item.title}</h3><p>{item.copy}</p></article>)}
          </div>
        </section>

        <section className="privacy-panel shell" id="privacy" aria-labelledby="privacy-title">
          <div className="privacy-panel__intro"><span className="privacy-panel__icon"><img src={asset('privacy-shield.svg')} width="34" height="40" alt="" /></span><h2 id="privacy-title">Your Screen<ResponsiveBreak />Stays Private</h2><p>Seamless Close uses a temporary image of your desktop. That image stays on your Mac.</p></div>
          <div className="privacy-panel__facts">
            <div><h3>No continuous recording</h3><p>One temporary screenshot powers each gesture.</p></div>
            <div><h3>Never saved or shared</h3><p>Screen images stay in memory. They are never saved or sent.</p></div>
            <div><h3>No analytics</h3><p>The app connects to this site for update checks and downloads.</p></div>
          </div>
        </section>

        <section className="section section--faq shell" id="good-to-know" aria-labelledby="faq-title">
          <div className="faq-intro"><h2 id="faq-title">Before You Try It</h2><p>Requirements, permissions and a few useful details about the beta.</p></div>
          <div className="faq-list">
            {faq.map((item) => <div className="faq-item" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
            <div className="faq-item"><h3>How do I install the beta?</h3><p>Open the DMG and drag Glissform to Applications. The beta is not Apple notarized. If macOS blocks the first launch, go to System Settings → Privacy &amp; Security → Open Anyway, if you trust the download.</p></div>
          </div>
        </section>

        <DownloadPanel><DownloadLink /></DownloadPanel>
      </main>
      <footer className="site-footer shell"><Brand /><span>© 2026 Glissform</span></footer>
    </div>
  </>;
}

export default App;
