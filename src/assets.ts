import seamlessSettings from './generated/assets/seamless-settings.webp';
import batterySettings from './generated/assets/battery-settings.webp';
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
  'seamless-settings.png': seamlessSettings,
  'battery-settings.png': batterySettings,
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
