import { useLayoutEffect, useRef } from 'react';
import { FeatureCursor } from './FeatureCursor';
import { AngleCounter } from './AngleCounter';
import { animateManualAngle } from './manualAngleMotion';
import './manual-angle-visual.scss';

export function ManualAngleVisual() {
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateManualAngle(visual.current!), []);

  return <div className="manual-angle-visual" ref={visual}>
    <div className="manual-angle-visual__control">
      <div className="manual-angle-visual__track">
        <div className="manual-angle-visual__fill" />
      </div>
      <div className="manual-angle-visual__handle" />
      <div className="manual-angle-visual__tooltip">
        <AngleCounter initialAngle={90} />
      </div>
      <div className="manual-angle-visual__limits"><span>20°</span><span>130°</span></div>
    </div>
    <FeatureCursor className="manual-angle-visual__cursor" />
  </div>;
}
