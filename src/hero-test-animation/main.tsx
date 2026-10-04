import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import DownloadLink from '../DownloadLink';
import { macBookGeometry } from '../MacBookShell';
import MacBookKeyboard from '../MacBookKeyboard';
import { downloadUrl, siteUrl } from '../siteMetadata';
import AnimationHeroNavigation from './AnimationHeroNavigation';
import AnimationHeroStarField from './AnimationHeroStarField';
import MenuBar from '../hero-test/MenuBar';
import logo from '../hero-test/assets/glissform.webp';
import notch from '../hero-test/assets/notch.svg';
import { scenePose, screenPose } from './choreography';
import { compose, projectQuad, sceneProjection, translate } from './sceneProjection';
import { connectProjectedGlass } from './projectedGlass';
import { cancelHeroFrame, requestSceneFrame, setHeroScreenProjection } from './frameSync';
import type { MacBookHardwareRenderer } from './macBookHardware';
import '../styles.scss';
import '../hero-test/hero-test.scss';
import './scene.scss';

const previewDownloadUrl = new URL(downloadUrl, siteUrl).href;
const desktopViewport = window.matchMedia('(min-width: 1156px)');
const subscribeToViewport = (callback: () => void) => {
  desktopViewport.addEventListener('change', callback);
  return () => desktopViewport.removeEventListener('change', callback);
};

function HeroAnimation() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<HTMLDivElement>(null);
  const [templateNeeded, setTemplateNeeded] = useState(true);

  useEffect(() => connectProjectedGlass(surfaceRef.current!), []);

  useLayoutEffect(() => {
    const track = trackRef.current!, stage = stageRef.current!, canvas = canvasRef.current!;
    const surface = surfaceRef.current!, desktop = desktopRef.current!, finish = finishRef.current!;
    const closingCopy = stage.querySelector<HTMLElement>('.hero-animation__closing-copy')!;
    const halo = stage.querySelector<HTMLElement>('.hero-animation__halo')!;
    const shadow = stage.querySelector<HTMLElement>('.hero-animation__screen-shadow')!;
    const contact = stage.querySelector<HTMLElement>('.hero-animation__contact-shadow')!;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    let renderer: MacBookHardwareRenderer | null = null;
    let width = 0, height = 0, openingHeight = 0, travel = 1, top = 0;
    let current = 0, target = 0, frame = 0, previousTime = 0;
    let disposed = false, failed = false, initializing = false, lastVisible = true, lastActive = false;
    // Cache individual properties. No inherited custom properties invalidate the
    // whole hero, and settled phases do not repeat identical DOM mutations.
    const values = new WeakMap<HTMLElement, Map<string, string>>();
    const style = (element: HTMLElement, property: string, value: string) => {
      let previous = values.get(element);
      if (!previous) { previous = new Map(); values.set(element, previous); }
      if (previous.get(property) === value) return;
      element.style.setProperty(property, value); previous.set(property, value);
    };
    const inert = (element: HTMLElement, value: boolean) => { if (element.inert !== value) element.inert = value; };
    const draw = () => {
      const active = current > 0 && !!renderer && !motion.matches && !failed;
      const pose = scenePose(active ? current : 0, width, height, openingHeight);
      const projection = sceneProjection(pose, width, height, openingHeight);
      if (active !== lastActive) {
        surface.classList.toggle('hero-animation__surface--moving', active);
        lastActive = active;
      }
      style(canvas, 'display', active && renderer ? 'block' : 'none');
      if (active && renderer) renderer.render({ fold: pose.fold, modelMatrix: projection.model, perspective: projection.perspective, opacity: pose.metal });
      style(surface, 'transform', active ? `matrix3d(${projection.screen.join(',')})` : 'none');
      style(surface, 'border-radius', active ? `${26 + (22 * width / macBookGeometry.width - 26) * pose.metal}px / ${26 + (22 * openingHeight / macBookGeometry.depth - 26) * pose.metal}px` : '26px');
      const visible = !active || projection.visible;
      if (visible !== lastVisible) {
        style(surface, 'visibility', visible ? 'visible' : 'hidden');
        inert(surface, !visible); lastVisible = visible;
      }
      style(halo, 'opacity', String(pose.reveal));
      style(closingCopy, 'opacity', String(pose.title));
      style(closingCopy, 'transform', `translateY(${(1 - pose.title) * 22}px)`);
      style(finish, 'opacity', String(pose.finish));
      inert(finish, pose.finish < .99);
      const hiddenTitle = String(pose.title < .5);
      if (closingCopy.getAttribute('aria-hidden') !== hiddenTitle) closingCopy.setAttribute('aria-hidden', hiddenTitle);
      if (visible) {
        const effect = screenPose(pose.fold, width - 32, openingHeight - 32);
        style(desktop, 'transform', pose.fold ? `matrix3d(${effect.matrix.join(',')})` : 'none');
        // One blur pass supplies the soft close. The old masked backdrop blur
        // captured and blurred the same animated desktop a second time.
        const blur = Math.hypot(effect.blur, effect.frost * .45);
        style(desktop, 'filter', blur > .01 ? `blur(${blur.toFixed(3)}px)` : 'none');
        style(shadow, 'opacity', String(effect.shadow));
        style(contact, 'opacity', String(effect.contact));
        style(contact, 'background', `linear-gradient(#000, transparent ${effect.contactWidth}%)`);
        const stageTop = motion.matches || failed ? top - window.scrollY : Math.min(Math.max(top - window.scrollY, 0), top + travel - window.scrollY);
        const inner = compose(translate(0, stageTop), projection.screen, translate(16, 16), effect.matrix);
        setHeroScreenProjection({ quad: projectQuad(inner, width - 32, openingHeight - 32), width: width - 32, height: openingHeight - 32, interactive: true });
      } else {
        setHeroScreenProjection({ quad: projectQuad(projection.screen, width, openingHeight), width: width - 32, height: openingHeight - 32, interactive: false });
      }
      if (import.meta.env.DEV) {
        stage.dataset.progress = current.toFixed(5);
        stage.dataset.fold = pose.fold.toFixed(3);
      }
    };
    const tick = (time: number) => {
      frame = 0;
      if (!renderer && !motion.matches && !failed) { previousTime = 0; return; }
      const dt = Math.min(64, previousTime ? time - previousTime : 16.67);
      previousTime = time;
      current += (target - current) * (1 - Math.exp(-dt / 95));
      if (Math.abs(target - current) < .00003) current = target;
      draw();
      if (current !== target) frame = requestSceneFrame(tick);
      else previousTime = 0;
    };
    const syncScroll = () => {
      target = motion.matches || failed ? 0 : Math.max(0, Math.min(1, (window.scrollY - top) / travel));
      if (target > 0 && !renderer) void initialize();
      if (!frame && !document.hidden && (current !== target || motion.matches || failed)) frame = requestSceneFrame(tick);
    };
    const measure = () => {
      width = stage.clientWidth; height = stage.clientHeight;
      openingHeight = Math.max(720, height);
      top = track.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, track.offsetHeight - window.innerHeight);
      style(surface, 'width', `${width}px`); style(surface, 'height', `${openingHeight}px`);
      renderer?.resize(width, height, window.devicePixelRatio);
      syncScroll(); current = renderer ? target : 0; draw();
    };
    const fallback = () => {
      if (disposed) return;
      failed = true; renderer?.dispose(); renderer = null;
      track.classList.add('hero-animation--static');
      current = target = 0; cancelHeroFrame(frame); frame = 0;
      measure();
    };
    const initialize = async () => {
      if (disposed || initializing || motion.matches) return;
      initializing = true;
      try {
        const { createMacBookHardware } = await import('./macBookHardware');
        if (disposed) return;
        const next = await createMacBookHardware(canvas, templateRef.current!, controller.signal);
        if (disposed) { next?.dispose(); return; }
        renderer = next; setTemplateNeeded(false);
        if (!renderer) { fallback(); return; }
        renderer.resize(width, height, window.devicePixelRatio);
        draw();
        if (current !== target && !frame && !document.hidden) frame = requestSceneFrame(tick);
      } catch { if (!disposed) setTemplateNeeded(false); fallback(); }
    };
    const visibility = () => {
      cancelHeroFrame(frame); frame = 0; previousTime = 0;
      if (!document.hidden) { syncScroll(); draw(); }
    };
    const preference = () => { measure(); if (!motion.matches) void initialize(); };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    canvas.addEventListener('webglcontextlost', fallback);
    measure();
    // Warm static artwork during idle time, without a render loop or visible
    // canvas on the opening hero. Reduced Motion never initializes WebGL.
    const idle = 'requestIdleCallback' in window ? window.requestIdleCallback(() => void initialize(), { timeout: 1500 }) : 0;
    const timer = idle ? 0 : window.setTimeout(() => void initialize(), 300);
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    return () => {
      disposed = true; controller.abort(); renderer?.dispose();
      if (idle) window.cancelIdleCallback(idle); clearTimeout(timer);
      cancelHeroFrame(frame); setHeroScreenProjection(null); observer.disconnect();
      window.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', measure);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
      canvas.removeEventListener('webglcontextlost', fallback);
    };
  }, []);

  return <section className="hero-animation" ref={trackRef} aria-label="Glissform Seamless Close scroll experience">
    <div className="hero-animation__stage" ref={stageRef}>
      <div className="hero-animation__halo" aria-hidden="true" />
      <div className="hero-animation__closing-copy" aria-hidden="true">
        <span>Seamless Close</span>
        <p>A little magic.<br /><span>Every time you close.</span></p>
      </div>
      <canvas className="hero-animation__hardware" ref={canvasRef} aria-hidden="true" />
      <main className="hero-test hero-animation__surface" ref={surfaceRef} aria-labelledby="hero-test-title">
        <div className="hero-test__screen">
          <div className="hero-animation__desktop" ref={desktopRef}>
            <div className="hero-test__atmosphere" aria-hidden="true">
              <div className="hero-test__glow hero-test__glow--blue" />
              <div className="hero-test__glow hero-test__glow--violet" />
              <div className="hero-test__glow hero-test__glow--teal" />
              <AnimationHeroStarField surfaceRef={surfaceRef} />
            </div>
            <MenuBar />
            <div className="hero-test__offer">
              <div className="hero-test__intro">
                <div className="hero-test__brand"><img src={logo} width="28" height="28" alt="" /><span>Glissform</span></div>
                <div className="hero-test__copy">
                  <h1 id="hero-test-title">Your Lid Moves.<br />Desktop Stays In Place</h1>
                  <p><span>An iPhone Duo-style animation for your MacBook.</span>{' '}<span>Perspective, blur and shadow follow the lid as it closes.</span></p>
                </div>
              </div>
              <DownloadLink href={previewDownloadUrl} />
            </div>
            <AnimationHeroNavigation downloadHref={previewDownloadUrl} />
          </div>
          <div className="hero-animation__screen-shadow" aria-hidden="true" />
          <div className="hero-animation__contact-shadow" aria-hidden="true" />
        </div>
        <div className="hero-test__frame" aria-hidden="true" />
        <img className="hero-test__notch" src={notch} width="214" height="42" alt="" aria-hidden="true" />
      </main>
      <div className="hero-animation__finish" ref={finishRef}>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 7 4-4 4 4M8 3v10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Scroll back to reopen
        </button>
      </div>
    </div>
    {templateNeeded && <div className="hero-animation__template seamless-macbook--animated" ref={templateRef} style={{
      '--hardware-width': `${macBookGeometry.width}px`, '--hardware-depth': `${macBookGeometry.depth}px`,
      '--hardware-radius': `${macBookGeometry.radius}px`, '--hardware-left': '39.1305px',
    } as CSSProperties} aria-hidden="true" inert>
      <div className="seamless-macbook__deck"><MacBookKeyboard /></div>
    </div>}
  </section>;
}

function Preview() {
  const desktop = useSyncExternalStore(subscribeToViewport, () => desktopViewport.matches);
  return desktop ? <HeroAnimation /> : <main className="hero-test-placeholder">
    <img src={logo} width="48" height="48" alt="Glissform" />
    <h1>A little more room, please.</h1>
    <p>Open this preview on your MacBook or widen your browser window to view the desktop design.</p>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Preview />);
if (import.meta.env.DEV && new URLSearchParams(location.search).has('profile')) {
  void import('./frameProbe').then(({ mountFrameProbe }) => mountFrameProbe());
}
