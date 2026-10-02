import blurHigh from './generated/assets/blur-high.webp';
import blurRegular from './generated/assets/blur-regular.webp';
import blurSubtle from './generated/assets/blur-subtle.webp';
import glissform64 from './generated/assets/glissform-icon-64.webp';
import glissform128 from './generated/assets/glissform-icon-128.webp';
import glissform256 from './generated/assets/glissform-icon-256.webp';
import navbar64 from './generated/assets/navbar-glissform-icon-64.webp';
import navbar128 from './generated/assets/navbar-glissform-icon-128.webp';
import navbar256 from './generated/assets/navbar-glissform-icon-256.webp';

const images: Record<string, string> = {
  'blur-high.png': blurHigh,
  'blur-regular.png': blurRegular,
  'blur-subtle.png': blurSubtle,
  'glissform-icon.png': glissform64,
  'navbar-glissform-icon.png': navbar64,
};

export const asset = (name: string) => images[name] ?? '/assets/' + name;
export const brandSrcSet = (navbar = false) => navbar
  ? `${navbar64} 64w, ${navbar128} 128w, ${navbar256} 256w`
  : `${glissform64} 64w, ${glissform128} 128w, ${glissform256} 256w`;

// Keep original masters as the largest candidate for high-density screens.
const responsiveImages = import.meta.glob([
  './generated/assets/blur-{high,regular,subtle}-{240,480}.webp',
], {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
export const screenshotSrcSet = (name: string) => {
  const base = name.replace(/\.png$/, '');
  const widths = [240, 480];
  const originalWidth = 960;
  return [...widths.map(width => `${responsiveImages[`./generated/assets/${base}-${width}.webp`]} ${width}w`),
    `${asset(name)} ${originalWidth}w`].join(', ');
};
// object-fit: cover also needs enough pixels for the cropped image's height.
export const blurImageSizes = '(max-width: 768px) max(205px, 28.8vw), (max-width: 1155px) 304px, 205px';
