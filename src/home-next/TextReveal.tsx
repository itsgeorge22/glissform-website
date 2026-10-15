import './text-reveal.scss';

/** Keep the real text accessible while explicit lines preserve the motion layout. */
export function TextLine({ text }: { text: string }) {
  return <span className="text-reveal__line">
    <span className="text-reveal__content"><span className="text-reveal__ink">{text}</span></span>
  </span>;
}
