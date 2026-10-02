import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { asset, screenshotSrcSet } from './assets';
import wallpaper from './generated/assets/seamless-desktop.webp';
import foldedWallpaper from './generated/assets/seamless-desktop-folded.webp';
import ResponsiveBreak from './ResponsiveBreak';
import { createDesktopReturnPreview, type ReturnPhase } from './desktopReturnPreview';
import { createDesktopReturnRenderer } from './desktopReturnRenderer';

const blurOptions = ['Subtle', 'Regular', 'High'] as const;
type Blur = typeof blurOptions[number];

function BlurPreview() {
  const [blur, setBlur] = useState<Blur>('Regular');
  const image = `blur-${blur.toLowerCase()}.png`;
  return <div className="blur-lab" data-blur={blur}>
    <div className="blur-lab__copy"><h3 id="feature-blur-title">A Softer Way<ResponsiveBreak />To Close</h3><p>Perspective and shadow follow your lid. Choose Subtle, Regular or High blur for a frosted finish.</p></div>
    <div className="feature-screen blur-lab__screen" role="img" aria-label={`Seamless Close wallpaper preview with ${blur.toLowerCase()} blur`}>
      <img src={asset(image)}
        srcSet={screenshotSrcSet(image)}
        sizes="(max-width: 768px) calc(100vw - 64px), (max-width: 1155px) 848px, 828px"
        width="960" height="600" loading="lazy" decoding="async" alt="" />
    </div>
    <div className="blur-lab__controls">
      <div className="feature-segments" role="group" aria-label="Preview blur strength">
        {blurOptions.map(option => <button type="button" key={option} aria-pressed={blur === option} onClick={() => setBlur(option)}>{option}</button>)}
      </div>
    </div>
  </div>;
}

function AnglePreview() {
  const [angle, setAngle] = useState(90);
  const [learning, setLearning] = useState(false);
  const [learned, setLearned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stop = () => { clearTimeout(timer.current); timer.current = undefined; setLearning(false); };
  useEffect(() => {
    const cancel = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', cancel);
    return () => { clearTimeout(timer.current); document.removeEventListener('visibilitychange', cancel); };
  }, []);
  const learn = () => {
    stop();
    setLearned(false);
    setLearning(true);
    setAngle(108);
    timer.current = setTimeout(() => { setAngle(107); setLearning(false); setLearned(true); }, 1000);
  };
  const radians = angle * Math.PI / 180;
  return <div className="angle-lab" data-learning={learning}>
    <div className="angle-lab__reading" aria-live="polite"><strong>{angle}<span>°</span></strong><span>{learning ? 'A still lid…' : learned ? 'An angle, learned' : 'Your starting angle'}</span></div>
    <svg className="angle-lab__drawing" viewBox="0 0 520 360" role="img" aria-label={`Side view of a MacBook lid at ${angle} degrees`}>
      <defs>
        <linearGradient id="feature-aluminium" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fafbfc" /><stop offset=".45" stopColor="#d9dce1" /><stop offset="1" stopColor="#9da4ae" /></linearGradient>
      </defs>
      <ellipse cx="254" cy="292" rx="152" ry="7" fill="#203047" opacity=".055" />
      <path d={`M200 280 A70 70 0 0 1 ${270 - 70 * Math.cos(radians)} ${280 - 70 * Math.sin(radians)}`} fill="none" stroke="#0073ff" strokeWidth="1.5" opacity=".4" />
      <line x1="270" y1="280" x2="270" y2="70" stroke="#bac4d1" strokeDasharray="3 7" opacity=".65" />
      <g className="angle-lab__lid" style={{ transform: `rotate(${angle}deg)` } as CSSProperties}>
        <rect x="70" y="269" width="204" height="9" rx="4.5" fill="url(#feature-aluminium)" stroke="#aab0b9" strokeWidth=".7" />
        <rect x="77" y="277" width="190" height="2.5" rx="1" fill="#242a35" />
      </g>
      <path d="M63 281 H290 L283 287 Q281 289 274 289 H82 Q66 289 63 281Z" fill="url(#feature-aluminium)" stroke="#a9b1bb" strokeWidth=".7" />
      <circle cx="271" cy="280" r="4.5" fill="#9099a6" />
      <circle cx="271" cy="280" r="1.8" fill="#dbe0e7" />
    </svg>
    <div className="angle-lab__controls">
      <label className="feature-control-label" htmlFor="feature-start-angle">Move the angle. Make it yours.</label>
      <input id="feature-start-angle" className="feature-range" type="range" min="20" max="130" value={angle} aria-valuetext={`${angle} degrees`} onChange={event => { stop(); setLearned(false); setAngle(Number(event.target.value)); }} style={{ '--range-progress': `${(angle - 20) / 110 * 100}%` } as CSSProperties} />
      <div className="angle-lab__limits"><span>20°</span><button type="button" className="feature-text-button" onClick={learn} disabled={learning}>{learning ? 'Learning…' : 'Try automatic selection'}</button><span>130°</span></div>
    </div>
  </div>;
}

function ReturnPreview() {
  const [phase, setPhase] = useState<ReturnPhase>('folded');
  const [glow, setGlow] = useState(true);
  const foldRef = useRef<HTMLCanvasElement>(null);
  const connectionRef = useRef<HTMLSpanElement>(null);
  const preview = useRef<ReturnType<typeof createDesktopReturnPreview> | null>(null);
  useEffect(() => {
    const fold = foldRef.current;
    const connection = connectionRef.current;
    if (!fold || !connection) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: ReturnType<typeof createDesktopReturnRenderer> = null;
    let disposed = false;
    const controller = createDesktopReturnPreview({
      fold, connection, onPhase: setPhase,
      reducedMotion: () => motion.matches || fold.dataset.renderer !== 'ready',
      render: degrees => renderer?.render(degrees),
    });
    preview.current = controller;
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      renderer = createDesktopReturnRenderer(fold, image);
      controller.redraw();
    };
    image.src = wallpaper;
    const resize = new ResizeObserver(() => controller.redraw());
    resize.observe(fold);
    const contextLost = () => { controller.reset(); };
    fold.addEventListener('webglcontextlost', contextLost);
    const hide = () => { if (document.hidden) controller.reset(); };
    const motionChanged = () => controller.reset();
    document.addEventListener('visibilitychange', hide);
    motion.addEventListener('change', motionChanged);
    return () => {
      disposed = true;
      image.onload = null;
      resize.disconnect();
      fold.removeEventListener('webglcontextlost', contextLost);
      controller.dispose();
      renderer?.dispose();
      preview.current = null;
      document.removeEventListener('visibilitychange', hide);
      motion.removeEventListener('change', motionChanged);
    };
  }, []);
  return <div className="return-lab" data-phase={phase} tabIndex={0} role="group" aria-label="Interactive desktop return preview" onKeyDown={event => { if (event.key === 'Escape' && !event.repeat) { event.preventDefault(); preview.current?.escape(); } }}>
    <div className="feature-screen return-lab__screen" role="img" aria-label={phase === 'returned' ? 'The clear desktop is restored' : 'A folded desktop waiting to return'}>
      <canvas ref={foldRef} className="return-lab__fold" aria-hidden="true" />
      <img className="return-lab__fallback" src={phase === 'returned' ? wallpaper : foldedWallpaper} width="960" height="600" loading="lazy" decoding="async" alt="" />
      <span ref={connectionRef} className="return-lab__glow" aria-hidden="true" />
    </div>
    <div className="feature-chapter__copy">
      <h3 id="feature-return-title">Pause The Lid<ResponsiveBreak />Keep Your Flow</h3>
      <p>Hold the lid still and your desktop returns after 1 second by default. Set the wait from 0.5 to 10 seconds in Settings. Press Esc to return immediately, or reopen the lid to reverse the animation.</p>
      <div className="feature-connection">
        <div className="feature-connection__header">
          <div className="feature-connection__title"><span className="feature-connection__icon" aria-hidden="true" /><h4>Connection effect</h4></div>
          <button className="feature-toggle" type="button" role="switch" aria-label="Preview connection glow" aria-checked={glow} onClick={() => { const enabled = !glow; setGlow(enabled); preview.current?.setConnectionEnabled(enabled); }}><span /></button>
        </div>
        <p>A soft edge glow and a short click finish the return. Switch it on and off in Settings.</p>
      </div>
      <div className="return-lab__controls">
        <div className="return-lab__actions">
          <button type="button" className="download-link download-link--secondary feature-action" onClick={() => preview.current?.pause()} disabled={phase === 'preparing' || phase === 'waiting' || phase === 'returning'}>
            <span className="download-link__glass" aria-hidden="true"><span className="download-link__glint" /></span>
            <span className="download-link__label">{phase === 'preparing' ? 'Preparing…' : phase === 'waiting' ? 'Holding still…' : phase === 'returning' ? 'Returning…' : 'Try a pause'}</span>
          </button>
          <button type="button" className="feature-escape" onClick={() => preview.current?.escape()} disabled={phase === 'returning'}><kbd>Esc</kbd><span>Return now</span></button>
        </div>
      </div>
    </div>
  </div>;
}

export default function SeamlessFeatures() {
  return <section className="features-story shell" id="customise" aria-labelledby="features-title">
    <div className="section-intro features-story__intro">
      <h2 id="features-title">One Familiar Gesture<ResponsiveBreak />A Few Thoughtful Details</h2>
      <p>A MacBook lid-closing animation that moves with you. Explore the blur, the starting angle and the way back to your desktop.</p>
    </div>

    <article className="feature-chapter feature-chapter--material" aria-labelledby="feature-blur-title">
      <BlurPreview />
    </article>

    <article className="feature-chapter feature-chapter--angle" aria-labelledby="feature-angle-title">
      <div className="feature-chapter__copy">
        <h3 id="feature-angle-title">It Begins<ResponsiveBreak />Where You Want</h3>
        <p>Choose when Seamless Close begins. Set the starting angle anywhere from 20° to 130°, or use your current lid angle. Automatic selection learns just below a still lid. Your manual angle remains the fallback.</p>
      </div>
      <AnglePreview />
    </article>

    <article className="feature-chapter feature-chapter--return" aria-labelledby="feature-return-title">
      <ReturnPreview />
    </article>
  </section>;
}
