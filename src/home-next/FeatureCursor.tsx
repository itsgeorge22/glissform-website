import './feature-cursor.scss';

export function FeatureCursor({ className = '' }: { className?: string }) {
  return <div className={`feature-cursor ${className}`}>
    <svg viewBox="0 0 30 38" width="30" height="38" aria-hidden="true">
      <path d="M2 2 L2 28.5 L9.1 22.1 L14.8 35.1 L20.3 32.7 L14.6 19.8 L24.5 19.3 Z" fill="#17191d" stroke="white" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  </div>;
}
