import './angle-counter.scss';

export function AngleCounter({ initialAngle }: { initialAngle: number }) {
  return <div className="angle-counter">
    {[100, 10, 1].map(place => <span className="angle-counter__digit" key={place}
      style={place === 100 ? { width: initialAngle >= 100 ? '.66em' : '0em' } : undefined}>
      <span className="angle-counter__reel" data-place={place}
        style={{ transform: `translate3d(0, -${Math.floor(initialAngle / place) % 10}em, 0)` }}>
        {Array.from({ length: 11 }, (_, digit) => <span key={digit}>
          {place === 100 && digit === 0 ? '\u00a0' : digit % 10}
        </span>)}
      </span>
    </span>)}
    <span className="angle-counter__degree">°</span>
  </div>;
}
