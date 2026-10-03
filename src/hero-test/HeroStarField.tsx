import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { connectStarField } from '../starFieldInteraction';
import { createHeroStars, type HeroStar } from './heroStarLayout';
import { connectShootingStars } from './shootingStars';
import { connectStarRipples } from './starRipple';

const starDepths = [2, 5, 8];

export default function HeroStarField({ surfaceRef }: { surfaceRef: RefObject<HTMLElement | null> }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const shootingRef = useRef<HTMLElement>(null);
  const [stars, setStars] = useState<HeroStar[]>([]);

  useEffect(() => {
    const field = fieldRef.current;
    const surface = surfaceRef.current;
    if (!field || !surface) return;
    const quietElements = Array.from(surface.querySelectorAll('.hero-test__offer'));
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = field.getBoundingClientRect();
      const quietRegions = quietElements.map(element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left - bounds.left, top: rect.top - bounds.top, right: rect.right - bounds.left, bottom: rect.bottom - bounds.top };
      });
      setStars(createHeroStars(bounds.width, bounds.height, quietRegions));
    };
    const observer = new ResizeObserver(() => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    });
    observer.observe(field);
    quietElements.forEach(element => observer.observe(element));
    measure();
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [surfaceRef]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const field = fieldRef.current;
    if (!surface || !field || !stars.length) return;
    const disconnectField = connectStarField({
      surface, field, starSelector: '.ambient-star',
      radius: width => Math.max(220, Math.min(300, width * .16)),
      // A fuller, rounded swell that holds while the cursor stays nearby.
      hoverScale: influence => 1 + 1.1 * influence * influence * (3 - 2 * influence),
      parallaxDepth: index => starDepths[index % starDepths.length],
    });
    const disconnectRipples = connectStarRipples(surface, field);
    return () => { disconnectRipples(); disconnectField(); };
  }, [surfaceRef, stars.length]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const field = fieldRef.current;
    const star = shootingRef.current;
    if (!surface || !field || !star) return;
    return connectShootingStars(surface, field, star);
  }, [surfaceRef]);

  return <div className="hero-test__stars" ref={fieldRef} aria-hidden="true">
    {stars.map(star => <i className="ambient-star" key={star.id} style={{
      left: `${star.x}px`, top: `${star.y}px`, opacity: star.opacity,
      '--spark-size': `${star.size}px`,
      '--spark-duration': `${star.duration}s`,
      '--spark-delay': `${star.delay}s`,
    } as CSSProperties}><span className="ambient-star__wave"><b className="ambient-star__core" /></span></i>)}
    <i className="hero-test__shooting-star" ref={shootingRef} />
  </div>;
}
