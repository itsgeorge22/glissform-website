import { useId } from 'react';
import logo from '../hero-test/assets/glissform.webp?url';
import resting384 from '../generated/assets/macbook-resting-384.webp?url';
import resting768 from '../generated/assets/macbook-resting-768.webp?url';

/** Compact views share the desktop's resting pose without loading its renderer. */
export default function CompactMacBook() {
  const id = useId();
  return <>
    <picture className="compact-macbook compact-macbook--resting" aria-hidden="true">
      <source media="(width < 1200px)"
        srcSet={`${resting384} 384w, ${resting768} 768w, ${import.meta.env.BASE_URL}assets/macbook-resting.webp 1408w`}
        sizes="min(calc(100vw - 48px), 772px)" />
      <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
        width="1408" height="560" alt="" loading="lazy" decoding="async" />
    </picture>
    <svg className="compact-macbook compact-macbook--upright" viewBox="0 0 560 340" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-metal`} x2="0" y2="1">
        <stop stopColor="#e2e6eb" /><stop offset=".45" stopColor="#b5bdc8" /><stop offset="1" stopColor="#8993a1" />
      </linearGradient>
      <radialGradient id={`${id}-screen`} cx=".5" cy="1" r=".95">
        <stop stopColor="#155bba" /><stop offset=".55" stopColor="#13294d" /><stop offset="1" stopColor="#0b121e" />
      </radialGradient>
      <radialGradient id={`${id}-shadow`}>
        <stop stopColor="#193149" stopOpacity=".16" /><stop offset="1" stopColor="#193149" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="280" cy="316" rx="270" ry="23" fill={`url(#${id}-shadow)`} />
    <rect x="48" y="16" width="464" height="284" rx="16" fill={`url(#${id}-metal)`} />
    <rect x="50" y="18" width="460" height="280" rx="14" fill="#10141a" />
    <rect x="58" y="26" width="444" height="262" rx="8" fill={`url(#${id}-screen)`} />
    <path d="M248 25h64v7a6 6 0 0 1-6 6h-52a6 6 0 0 1-6-6Z" fill="#10141a" />
    <g fill="#c5dfff" opacity=".65">
      <circle cx="97" cy="71" r="1" /><circle cx="172" cy="49" r=".7" /><circle cx="419" cy="63" r="1" />
      <circle cx="464" cy="147" r=".8" /><circle cx="104" cy="208" r=".8" /><circle cx="398" cy="238" r="1" />
      <circle cx="334" cy="89" r=".6" /><circle cx="199" cy="242" r=".6" />
    </g>
    <image href={logo} x="256" y="130" width="48" height="48" />
    <path d="M12 298h536l-18 12a28 28 0 0 1-16 5H46a28 28 0 0 1-16-5Z" fill={`url(#${id}-metal)`} />
    <path d="M12 298h536" stroke="#e5e9ef" strokeWidth="2" />
    <path d="M240 299h80l-3 4h-74Z" fill="#a0a9b5" />
    </svg>
  </>;
}
