import { useLayoutEffect, useRef } from 'react';
import { AngleCounter } from './AngleCounter';
import { animateAutomaticAngle, automaticAngleDrawing, automaticAngleGeometry } from './automaticAngleMotion';
import './automatic-angle-visual.scss';

const initial = automaticAngleGeometry(75);

export function AutomaticAngleVisual() {
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => animateAutomaticAngle(visual.current!), []);

  return <div className="automatic-angle-visual" ref={visual}>
    <svg className="automatic-angle-visual__drawing" viewBox="0 0 360 270" aria-hidden="true">
      <path className="automatic-angle-visual__arc" d={initial.arc} />
      <g className="automatic-angle-visual__lid" transform={initial.lidTransform}>
        <path d={`M 0 0 H ${automaticAngleDrawing.panelLength}`} />
      </g>
      <path className="automatic-angle-visual__base" d={`M ${automaticAngleDrawing.hinge.x} ${automaticAngleDrawing.hinge.y} h ${automaticAngleDrawing.panelLength}`} />
    </svg>
    <div className="automatic-angle-visual__reading" style={{
      left: `${initial.label.x / automaticAngleDrawing.width * 100}%`,
      top: `${initial.label.y / automaticAngleDrawing.height * 100}%`,
    }}>
      <AngleCounter initialAngle={75} />
      <svg className="automatic-angle-visual__check" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m4 10 4 4 8-8" pathLength="1" />
      </svg>
    </div>
  </div>;
}
