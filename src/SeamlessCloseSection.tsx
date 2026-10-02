import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import MacBookKeyboard from "./MacBookKeyboard";
import MacBookShell, { macBookGeometry } from "./MacBookShell";
import stillUrl from './generated/assets/seamless-desktop-folded.webp';
import ResponsiveBreak from './ResponsiveBreak';

export default function SeamlessCloseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current!;
    const track = trackRef.current!;
    const device = deviceRef.current!;
    const canvas = canvasRef.current!;
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    let disposed = false;
    let loading = false;
    let near = false;
    let cleanup: (() => void) | undefined;
    let settled = false;
    // Reserve the final scroll distance before lazy setup so lower anchors and
    // reverse scrolling do not move when the renderer becomes ready.
    const reserveSpace = () => {
      if (disposed) return;
      // The still fallback must scale too, including when Reduce Motion skips JS motion.
      device.style.setProperty('--macbook-scale', String(device.clientWidth / 900));
      if (settled) return;
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      const distance = mobile ? Math.max(450, window.innerHeight * .9) : Math.max(800, window.innerHeight * 1.35);
      track.style.minHeight = motion.matches ? `${scene.offsetHeight + distance}px` : '';
    };
    const settle = () => {
      settled = true;
      track.style.removeProperty('min-height');
    };
    const sizeObserver = new ResizeObserver(reserveSpace);
    sizeObserver.observe(scene);
    window.addEventListener('resize', reserveSpace);
    reserveSpace();
    const prepare = () => {
      reserveSpace();
      if (!near || !motion.matches || loading || disposed) return;
      loading = true;
      void import('./seamlessMotion').then(({ mountSeamlessMotion }) => {
        if (!disposed && motion.matches) cleanup = mountSeamlessMotion(scene, track, device, canvas, settle);
        else loading = false;
      }).catch(() => { loading = false; settle(); }); // Keep the existing still fallback on load failure.
    };
    const observer = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      prepare();
    }, { rootMargin: '400px 0px' });
    observer.observe(scene);
    motion.addEventListener('change', prepare);
    return () => {
      disposed = true;
      observer.disconnect();
      sizeObserver.disconnect();
      window.removeEventListener('resize', reserveSpace);
      settle();
      motion.removeEventListener('change', prepare);
      cleanup?.();
      device.style.removeProperty('--macbook-scale');
    };
  }, []);

  return (
    <section
      className="seamless-section shell"
      id="seamless-close"
      aria-labelledby="seamless-title"
      ref={sectionRef}
    >
      <div className="section-intro seamless-section__intro">
        <h2 id="seamless-title">
          Your Lid Moves While
          <ResponsiveBreak />
          Your Desktop Stays In Place
        </h2>
        <p>
          As you close the lid, perspective, blur and shadow follow its
          movement,
          <ResponsiveBreak />
          making your desktop appear to stay in place.
        </p>
      </div>
      <div className="seamless-section__track" ref={trackRef}>
        <div className="seamless-section__scene" ref={sceneRef}>
          <div
            className="seamless-macbook"
            ref={deviceRef}
            style={
              {
                "--hardware-width": `${macBookGeometry.width}px`,
                "--hardware-depth": `${macBookGeometry.depth}px`,
                "--hardware-radius": `${macBookGeometry.radius}px`,
              } as CSSProperties
            }
            role="img"
            aria-label="Seamless Close preview: scroll down to close the MacBook lid as the desktop changes perspective, blur and shadow, revealing ‘A Little Magic Every Time You Close’. Scroll up to reopen it."
          >
            <div className="seamless-macbook__drawing" aria-hidden="true">
              <p className="seamless-macbook__reveal">
                A Little Magic
                <br />
                <span>Every Time You Close</span>
              </p>
              <canvas className="seamless-macbook__gpu" ref={canvasRef} />
              <div className="seamless-macbook__contact-shadow" />
              <div className="seamless-macbook__camera">
                <div className="seamless-macbook__hardware">
                  <div className="seamless-macbook__deck">
                    <MacBookShell thickness={17} offset={0} bottomRadius={11} />
                    <MacBookKeyboard />
                    <div className="seamless-macbook__trackpad" />
                    <div className="seamless-macbook__hinge" />
                  </div>
                  <div className="seamless-macbook__lid">
                    <MacBookShell thickness={6} offset={-6} />
                    <div className="seamless-macbook__back">
                      <span className="seamless-macbook__lid-mark" />
                    </div>
                    <div className="seamless-macbook__front">
                      <div className="seamless-macbook__bezel" />
                      <div className="seamless-macbook__screen">
                        <img
                          className="seamless-macbook__still"
                          src={stillUrl}
                          loading="lazy"
                          decoding="async"
                          width="960"
                          height="600"
                          alt=""
                        />
                      </div>
                      <div className="seamless-macbook__notch">
                        <span className="seamless-macbook__lens" />
                      </div>
                    </div>
                  </div>
                  <div className="seamless-macbook__base">
                    <span className="seamless-macbook__opening" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="seamless-section__footnote">
            Normal system sleep stays enabled.
          </p>
        </div>
      </div>
    </section>
  );
}
