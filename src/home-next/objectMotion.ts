import { ease } from './choreography.ts';

/** Shared damped settle for composed visuals, with a quiet, exact endpoint. */
export function springDisplacement(progress: number, damping: number, frequency: number) {
  return Math.exp(-damping * progress)
    * (Math.cos(frequency * progress) + damping / frequency * Math.sin(frequency * progress))
    * (1 - ease((progress - .72) / .28));
}
