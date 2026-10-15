export type QuietRegion = { left: number; top: number; right: number; bottom: number };
export type HeroStar = { id: number; x: number; y: number; size: number; opacity: number; duration: number; delay: number };

const fraction = (value: number) => value - Math.floor(value);
const smoothstep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function createHeroStars(width: number, height: number, quietRegions: QuietRegion[], scale = 1): HeroStar[] {
  width /= scale; height /= scale;
  quietRegions = quietRegions.map(rect => ({ left: rect.left / scale, top: rect.top / scale,
    right: rect.right / scale, bottom: rect.bottom / scale }));
  if (width <= 0 || height <= 120) return [];
  // Keep the reference field's density and positions as its composition scales.
  const count = Math.min(120, Math.max(36, Math.round(width * height / 18000)));
  return Array.from({ length: count }, (_, id) => {
    // A deterministic low-discrepancy field avoids both rows and random clumps.
    const x = 28 + fraction(.5 + id * .754877666) * (width - 56);
    const y = 76 + fraction(.5 + id * .569840291) * (height - 112);
    const quietFade = quietRegions.reduce((fade, rect) => {
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      // Leave breathing room for the star's own drift and pointer attraction.
      return Math.min(fade, smoothstep((Math.hypot(dx, dy) - 32) / 100));
    }, 1);
    return {
      id, x: x * scale, y: y * scale,
      size: (id % 11 === 0 ? 2.8 : id % 4 === 0 ? 1.9 : 1.25) * 1.1 * scale,
      opacity: (.65 + fraction(id * .381966011) * .35) * quietFade,
      duration: (10 + (id % 7) * 1.2) / 1.25,
      delay: -id * 1.7 / 1.25,
    };
  });
}
