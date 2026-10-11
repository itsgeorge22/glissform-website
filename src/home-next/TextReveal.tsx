import './text-reveal.scss';

/** Explicit reading lines keep the desktop composition stable during motion. */
export function TextLine({ text }: { text: string }) {
  return <span className="text-reveal__line" aria-hidden="true">
    <span className="text-reveal__content">{text}</span>
  </span>;
}
