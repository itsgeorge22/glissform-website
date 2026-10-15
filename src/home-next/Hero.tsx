import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import DownloadLink from '../DownloadLink';
import { downloadUrl, siteUrl } from '../siteMetadata';
import AnimationHeroNavigation from './HeroNavigation';
import FixedNavigation from './FixedNavigation';
import HeroAtmosphere from './HeroAtmosphere';
import GlissformBrand from './GlissformBrand';
import MenuBar from './MenuBar';
import KeyboardTemplate from './KeyboardTemplate';
import CompactNavigation from './CompactNavigation';
import CompactMacBook from './CompactMacBook';
import { desktopSceneQuery } from './responsive';
import { macBookDimensions } from './displayGeometry';
import { designScale } from './designScale';
import notch from '../hero-test/assets/notch.svg?url';
import { scenePose, screenPose, scrollCopyProgress } from './choreography';
import { TextLine } from './TextReveal';
import { createTextReveal } from './textRevealMotion';
import { playHeroEntrance } from './heroEntrance';
import { trackSectionNavigation } from './sectionNavigation';
import { controlMacScroll } from './macScroll';
import { compose, projectQuad, translate } from '../hero-test-animation/sceneProjection';
import { sceneProjection, lidClearProgress, cameraLayout, projectHardwareScreen } from './sceneProjection';
import { connectProjectedGlass } from '../hero-test-animation/projectedGlass';
import { cancelHeroFrame, requestSceneFrame, setHeroScreenProjection } from '../hero-test-animation/frameSync';
import type { ThreeHardwareRenderer } from './threeHardware';
import '../hero-test-animation/scene.scss';
import './hero.scss';
import './hero-prelude.scss';
import './hero-responsive.scss';

const previewDownloadUrl = new URL(downloadUrl, siteUrl).href;

const subscribeToViewport = (onChange: () => void) => {
  const viewport = window.matchMedia(desktopSceneQuery);
  viewport.addEventListener('change', onChange);
  return () => viewport.removeEventListener('change', onChange);
};
const desktopSnapshot = () => window.matchMedia(desktopSceneQuery).matches;
const serverDesktopSnapshot = () => false;

export default function Hero() {
  const sceneEnabled = useSyncExternalStore(subscribeToViewport, desktopSnapshot, serverDesktopSnapshot);
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const screenContentRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const [templateNeeded, setTemplateNeeded] = useState(false);

  useEffect(() => sceneEnabled ? connectProjectedGlass(surfaceRef.current!) : undefined, [sceneEnabled]);
  useEffect(trackSectionNavigation, []);
  useLayoutEffect(() => sceneEnabled ? playHeroEntrance(screenContentRef.current!) : undefined, [sceneEnabled]);

  useLayoutEffect(() => {
    if (!sceneEnabled) return;
    setTemplateNeeded(true);
    const track = trackRef.current!, stage = stageRef.current!, canvas = canvasRef.current!;
    const surface = surfaceRef.current!, desktop = desktopRef.current!, screenContent = screenContentRef.current!;
    const ending = stage.querySelector<HTMLElement>('.hero-animation__ending')!;
    const featureLabel = ending.querySelector<HTMLElement>('.hero-animation__feature-label')!;
    const revealFeatureLabel = createTextReveal(featureLabel);
    const heading = ending.querySelector<HTMLElement>('h2')!;
    const revealHeading = createTextReveal(heading);
    const description = ending.querySelector<HTMLElement>('.hero-animation__description')!;
    const revealDescription = createTextReveal(description);
    const navigation = navigationRef.current!;
    const screenNavigation = surface.querySelector<HTMLElement>('.hero-test__nav')!;
    const screenEdges = [surface.querySelector<HTMLElement>('.hero-test__screen')!, surface.querySelector<HTMLElement>('.hero-test__frame')!];
    const shadow = stage.querySelector<HTMLElement>('.hero-animation__screen-shadow')!;
    const contact = stage.querySelector<HTMLElement>('.hero-animation__contact-shadow')!;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isStatic = () => motion.matches || failed;
    const controller = new AbortController();
    let renderer: ThreeHardwareRenderer | null = null;
    let travel = 2000, scale = 1;
    let width = 0, height = 0, openingHeight = 0, top = 0;
    let endingScale = 1, endingTranslationY = 0;
    let featureLabelClearance = 1, headlineClearance = 1, subtitleClearance = 1;
    let current = 0, frame = 0;
    let scrollInput: ReturnType<typeof controlMacScroll> | undefined;
    let disposed = false, failed = false, initializing = false, lastVisible = true, lastActive = false;
    // Cache individual properties. No inherited custom properties invalidate the
    // whole hero, and settled phases do not repeat identical DOM mutations.
    const values = new WeakMap<HTMLElement, Map<string, string>>();
    const styledElements = new Set<HTMLElement>();
    const style = (element: HTMLElement, property: string, value: string) => {
      styledElements.add(element);
      let previous = values.get(element);
      if (!previous) { previous = new Map(); values.set(element, previous); }
      if (previous.get(property) === value) return;
      element.style.setProperty(property, value); previous.set(property, value);
    };
    const inert = (element: HTMLElement, value: boolean) => { if (element.inert !== value) element.inert = value; };
    const syncNavigationLayer = () => {
      // Raise the fixed dock once the Mac starts moving with the page.
      const released = !isStatic() && window.scrollY >= top + travel - 1;
      style(navigation, 'z-index', released ? '8' : '1');
    };
    const draw = () => {
      const active = current > 0 && !!renderer && !isStatic();
      const firstProgress = active ? Math.min(1, current) : 0;
      const pose = scenePose(firstProgress, width, height, openingHeight);
      const projection = sceneProjection(pose, width, height, openingHeight);
      // Keep the existing reveal framing and live-screen projection.
      const layout = cameraLayout(width, height, projection.perspective,
        1 + (endingScale - 1) * pose.reveal, endingTranslationY * pose.reveal);
      projection.model = compose(layout, projection.model);
      projection.screen = projectHardwareScreen(projection.model, pose.fold, width, height, openingHeight, projection.perspective);
      style(canvas, 'transform', 'none');
      if (active !== lastActive) {
        surface.classList.toggle('hero-animation__surface--moving', active);
        lastActive = active;
      }
      style(canvas, 'display', active && renderer ? 'block' : 'none');
      if (active && renderer) renderer.render({ fold: pose.fold, modelMatrix: projection.model,
        perspective: projection.perspective, elevation: 208 * (1 - pose.reveal), opacity: 1,
        shadowOpacity: 1 });
      for (const property of ['border-bottom-left-radius', 'border-bottom-right-radius']) {
        for (const edge of screenEdges) style(edge, property, `${17 * scale * pose.cornerRoundness}px`);
      }
      style(surface, 'transform', active ? `matrix3d(${projection.screen.join(',')})` : 'none');
      const visible = !active || projection.visible;
      if (visible !== lastVisible) {
        style(surface, 'visibility', visible ? 'visible' : 'hidden');
        inert(surface, !visible); lastVisible = visible;
      }
      const headlineProgress = scrollCopyProgress(firstProgress, headlineClearance, 'headline');
      revealFeatureLabel(scrollCopyProgress(firstProgress, featureLabelClearance, 'headline'));
      revealHeading(headlineProgress);
      revealDescription(scrollCopyProgress(firstProgress, subtitleClearance, 'subtitle'));
      style(navigation, 'opacity', String(pose.navigation));
      syncNavigationLayer();
      style(navigation, 'transform', `translateY(${(1 - pose.navigation) * -18 * scale}px) scale(${.97 + .03 * pose.navigation})`);
      inert(navigation, pose.navigation < .95);
      const hiddenNavigation = String(pose.navigation < .5);
      if (navigation.getAttribute('aria-hidden') !== hiddenNavigation) navigation.setAttribute('aria-hidden', hiddenNavigation);
      style(screenNavigation, 'opacity', String(pose.screenNavigation));
      inert(screenNavigation, pose.screenNavigation < .5);
      const hiddenScreenNavigation = String(pose.screenNavigation < .5);
      if (screenNavigation.getAttribute('aria-hidden') !== hiddenScreenNavigation) screenNavigation.setAttribute('aria-hidden', hiddenScreenNavigation);
      const hiddenEnding = String(headlineProgress < .5);
      if (ending.getAttribute('aria-hidden') !== hiddenEnding) ending.setAttribute('aria-hidden', hiddenEnding);
      if (visible) {
        const effect = screenPose(pose.fold, width - 32 * scale, openingHeight - 32 * scale);
        style(desktop, 'transform', pose.fold ? `matrix3d(${effect.matrix.join(',')})` : 'none');
        // Rasterize blur on a separate flat layer. Safari can shrink a filtered
        // projective matrix3d layer to a corner on Retina displays.
        const blur = Math.hypot(effect.blur, effect.frost * .45);
        style(screenContent, 'filter', blur > .01 ? `blur(${blur.toFixed(3)}px)` : 'none');
        style(shadow, 'opacity', String(effect.shadow));
        style(contact, 'opacity', String(effect.contact));
        style(contact, 'background', `linear-gradient(#000, transparent ${effect.contactWidth}%)`);
        const stageTop = isStatic() ? top - window.scrollY
          : Math.min(Math.max(top - window.scrollY, 0), top + travel - window.scrollY);
        const inner = compose(translate(0, stageTop), projection.screen, translate(16 * scale, 16 * scale), effect.matrix);
        setHeroScreenProjection({ quad: projectQuad(inner, width - 32 * scale, openingHeight - 32 * scale), width: width - 32 * scale, height: openingHeight - 32 * scale, interactive: true });
      } else {
        setHeroScreenProjection({ quad: projectQuad(projection.screen, width, openingHeight), width: width - 32 * scale, height: openingHeight - 32 * scale, interactive: false });
      }
      if (import.meta.env.DEV) {
        stage.dataset.progress = firstProgress.toFixed(5);
        stage.dataset.fold = pose.fold.toFixed(3);
      }
    };
    const tick = () => {
      frame = 0;
      draw();
    };
    const syncScroll = () => {
      current = isStatic() ? 0 : Math.max(0, Math.min(travel, window.scrollY - top)) / travel;
      if (current > 0 && !renderer) void initialize();
      if (!frame && !document.hidden) frame = requestSceneFrame(tick);
    };
    const measure = () => {
      scrollInput?.reset();
      width = stage.clientWidth; height = stage.clientHeight;
      scale = designScale(width);
      travel = 2000 * scale;
      openingHeight = Math.max(720 * scale, height);
      const endingBounds = sceneProjection(scenePose(1, width, height, openingHeight), width, height, openingHeight).bounds;
      // Use layout geometry so the copy's visual offset cannot move the Mac.
      const copyBottom = parseFloat(getComputedStyle(ending).top) + ending.getBoundingClientRect().height;
      const modelTop = copyBottom + 128 * scale;
      endingScale = Math.min(
        Math.min(1280 * scale, width - 128 * scale) / (endingBounds.right - endingBounds.left),
        Math.max(96 * scale, height - modelTop - 48 * scale) / (endingBounds.bottom - endingBounds.top),
      );
      endingTranslationY = modelTop - endingBounds.top * endingScale;
      const headlineTop = heading.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const subtitleTop = description.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const featureLabelTop = featureLabel.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      featureLabelClearance = lidClearProgress(width, height, openingHeight, endingScale, endingTranslationY, featureLabelTop);
      headlineClearance = lidClearProgress(width, height, openingHeight, endingScale, endingTranslationY, headlineTop);
      subtitleClearance = lidClearProgress(width, height, openingHeight, endingScale, endingTranslationY, subtitleTop);
      top = track.getBoundingClientRect().top + window.scrollY;
      style(track, '--mac-reveal-distance', `${travel}px`);
      style(surface, 'width', `${width}px`); style(surface, 'height', `${openingHeight}px`);
      if (!isStatic()) renderer?.resize(width, height, window.devicePixelRatio);
      syncScroll(); draw();
    };
    const fallback = () => {
      if (disposed) return;
      failed = true; renderer?.dispose(); renderer = null;
      track.classList.add('hero-animation--static');
      current = 0; cancelHeroFrame(frame); frame = 0;
      measure();
    };
    const initialize = async () => {
      if (disposed || renderer || initializing || isStatic()) return;
      initializing = true;
      try {
        const { createThreeHardware } = await import('./threeHardware');
        if (disposed || isStatic()) return;
        const next = await createThreeHardware(canvas, templateRef.current!, controller.signal);
        if (disposed || isStatic()) { next?.dispose(); return; }
        renderer = next;
        setTemplateNeeded(false);
        if (!renderer) { fallback(); return; }
        renderer.resize(width, height, window.devicePixelRatio);
        draw();
      } catch (error) {
        if (import.meta.env.DEV) console.error('MacBook initialization failed', error);
        if (!disposed) setTemplateNeeded(false);
        fallback();
      } finally { initializing = false; }
    };
    const visibility = () => {
      cancelHeroFrame(frame); frame = 0;
      if (!document.hidden) { syncScroll(); draw(); }
    };
    const preference = () => {
      track.classList.toggle('hero-animation--static', isStatic());
      measure(); if (!isStatic()) void initialize();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    // Native scrolling drives the existing pose without a controller that
    // rewrites scroll position during startup or browser history restoration.
    const pageScroll = () => {
      syncNavigationLayer();
      syncScroll();
    };
    window.addEventListener('scroll', pageScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    canvas.addEventListener('webglcontextlost', fallback);
    track.classList.toggle('hero-animation--static', isStatic());
    measure();
    scrollInput = controlMacScroll(() => ({ start: top, end: top + travel, enabled: !isStatic() }), () => {
      syncScroll();
      cancelHeroFrame(frame); frame = 0;
      draw();
    }, () => scale);
    // Warm static artwork during idle time, without a render loop or visible
    // canvas on the opening hero. Reduced Motion never initializes WebGL.
    const idle = 'requestIdleCallback' in window ? window.requestIdleCallback(() => void initialize(), { timeout: 1500 }) : 0;
    const timer = idle ? 0 : window.setTimeout(() => void initialize(), 300);
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    return () => {
      disposed = true; controller.abort(); renderer?.dispose();
      scrollInput?.dispose();
      if (idle) window.cancelIdleCallback(idle); clearTimeout(timer);
      cancelHeroFrame(frame); setHeroScreenProjection(null); observer.disconnect();
      window.removeEventListener('scroll', pageScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', measure);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
      canvas.removeEventListener('webglcontextlost', fallback);
      for (const element of styledElements) {
        for (const property of values.get(element)?.keys() ?? []) element.style.removeProperty(property);
      }
      track.classList.remove('hero-animation--static');
      surface.classList.remove('hero-animation__surface--moving');
      for (const element of [surface, screenNavigation, navigation, ending]) {
        element.inert = false;
        element.removeAttribute('aria-hidden');
      }
      revealFeatureLabel(1); revealHeading(1); revealDescription(1);
      setTemplateNeeded(false);
    };
  }, [sceneEnabled]);

  return <><CompactNavigation /><section className="hero-animation" ref={trackRef} aria-label="Glissform for macOS">
    <div className="hero-animation__stage" ref={stageRef}>
      <div className="hero-animation__ambience" aria-hidden="true" />
      <div className="hero-animation__hardware-viewport" aria-hidden="true">
        <canvas className="hero-animation__hardware" ref={canvasRef} />
      </div>
      <div className="hero-test hero-animation__surface" ref={surfaceRef} aria-labelledby="hero-test-title" data-prelude="pending">
        <div className="hero-test__screen">
          <div className="hero-animation__desktop" ref={desktopRef}>
            <div className="hero-animation__screen-content" ref={screenContentRef} data-entrance="pending">
            <HeroAtmosphere surfaceRef={surfaceRef} projected={sceneEnabled} />
            <MenuBar />
            <div className="hero-test__offer">
              <div className="hero-test__intro">
                <GlissformBrand />
                <div className="hero-test__copy">
                  <h1 id="hero-test-title" aria-label="Your Lid Moves. Desktop Stays In Place">
                    <TextLine text="Your Lid Moves." />{' '}
                    <TextLine text="Desktop Stays In Place" />
                  </h1>
                  <p aria-label="An iPhone Duo-style animation for your MacBook. Perspective, blur and shadow follow the lid as it closes.">
                    <TextLine text="An iPhone Duo-style animation for your MacBook." />{' '}
                    <TextLine text="Perspective, blur and shadow follow the lid as it closes." />
                  </p>
                </div>
              </div>
              <div className="hero-animation__action"><DownloadLink href={previewDownloadUrl} placement="hero" /></div>
            </div>
            <AnimationHeroNavigation downloadHref={previewDownloadUrl} />
            </div>
          </div>
          <div className="hero-animation__screen-shadow" aria-hidden="true" />
          <div className="hero-animation__contact-shadow" aria-hidden="true" />
        </div>
        <div className="hero-test__frame" aria-hidden="true" />
        <img className="hero-test__notch" src={notch} width="214" height="42" alt="" aria-hidden="true" />
      </div>
      <div className="hero-animation__ending" aria-hidden={sceneEnabled ? true : undefined}>
        <p className="hero-animation__feature-label" aria-label="Seamless Close">
          <TextLine text="Seamless Close" />
        </p>
        <h2 aria-label="Even closing feels satisfying">
          <TextLine text="Even closing" />{' '}
          <TextLine text="feels satisfying" />
        </h2>
        <p className="hero-animation__description" aria-label="A smooth MacBook lid animation that responds as you close it. Adjust the starting angle and blur strength in Glissform for macOS.">
          <TextLine text="A smooth MacBook lid animation that responds as you close it." />{' '}
          <TextLine text="Adjust the starting angle and blur strength in Glissform for macOS." />
        </p>
        <CompactMacBook />
      </div>
    </div>
    {templateNeeded && <div className="hero-animation__template seamless-macbook--animated" ref={templateRef} style={{
      '--hardware-width': `${macBookDimensions.width}px`, '--hardware-depth': `${macBookDimensions.depth}px`,
      '--hardware-radius': `${macBookDimensions.radius}px`, '--hardware-left': '39.1305px',
    } as CSSProperties} aria-hidden="true" inert>
      <div className="seamless-macbook__deck"><KeyboardTemplate /></div>
    </div>}
  </section>
    <FixedNavigation ref={navigationRef} sceneControlled />
  </>;
}
