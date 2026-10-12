import { useId, useLayoutEffect, useRef } from 'react';
import { FeatureCursor } from './FeatureCursor';
import { animateStayUpdated } from './stayUpdatedMotion';
import { updateArrowPath, updateShelfPath, updateLoaderPath } from './stayUpdatedIcon';
import { updateConfetti } from './stayUpdatedConfetti';
import './stay-updated-visual.scss';

export function StayUpdatedVisual() {
  const visual = useRef<HTMLDivElement>(null);
  const arrowClip = useId();
  useLayoutEffect(() => animateStayUpdated(visual.current!), []);

  return <div className="stay-updated-visual" ref={visual}>
    <div className="stay-updated-visual__confetti" aria-hidden="true">
      {updateConfetti.map((piece, index) => <i key={index} style={{
        backgroundColor: piece.color, width: `${piece.width}em`, height: `${piece.height}em`,
        borderRadius: piece.round ? '50%' : '1em',
      }} />)}
    </div>
    <div className="stay-updated-visual__card">
      <div className="stay-updated-visual__fold">
        <div className="stay-updated-visual__content">
          <div className="stay-updated-visual__information">
            <div className="stay-updated-visual__icon">
              <svg viewBox="0 0 38.5542 38.5542" width="38.5542" height="38.5542" aria-hidden="true">
                <defs><clipPath id={arrowClip}><rect width="38.5542" height="31.5" /></clipPath></defs>
                <g clipPath={`url(#${arrowClip})`}><path data-update-arrow d={updateArrowPath} fill="currentColor" fillRule="evenodd" /></g>
                <path data-update-shelf d={updateShelfPath} fill="currentColor" fillRule="evenodd" />
                <g data-update-spinner><path data-update-loader d={updateLoaderPath(0)} fill="none" stroke="currentColor" strokeWidth="3.21285" strokeLinecap="round" strokeLinejoin="round" /></g>
              </svg>
            </div>
            <div className="stay-updated-visual__copy">
              <div className="stay-updated-visual__title">
                <div className="stay-updated-visual__copy-track"><span>Update available!</span><span>Update in progress</span></div>
              </div>
              <div className="stay-updated-visual__description">
                <div className="stay-updated-visual__copy-track"><span>Get the new version.</span><span data-update-countdown>5 seconds left...</span></div>
              </div>
            </div>
          </div>
          <div className="stay-updated-visual__button">
            {[false, true].map(filled => <div className={filled ? 'stay-updated-visual__fill' : 'stay-updated-visual__labels'} key={String(filled)}>
              <div className="stay-updated-visual__button-track">
                {['Update', 'Updating...', 'Done!'].map(label => <div className="stay-updated-visual__button-label" key={label}><span>{label}</span></div>)}
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    <FeatureCursor />
  </div>;
}
