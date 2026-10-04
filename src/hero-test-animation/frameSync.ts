import type { PlaneQuad } from './projectedPointer.ts';

/** Corners of the inner desktop, after both the lid and screen projections. */
export type HeroScreenProjection = {
  quad: PlaneQuad;
  width: number;
  height: number;
  interactive: boolean;
};

type Interaction = (projection: HeroScreenProjection | null, time: number) => void;
const sceneCallbacks = new Map<number, FrameRequestCallback>();
const interactions = new Set<Interaction>();
const dirtyInteractions = new Set<Interaction>();
let projection: HeroScreenProjection | null = null;
let nextId = 1;
let frame = 0;
let flushing = false;

function ensureFrame() {
  if (!frame && !flushing) frame = requestAnimationFrame(flush);
}

function cancelEmptyFrame() {
  if (frame && !sceneCallbacks.size && !dirtyInteractions.size) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

function invoke(callback: () => void) {
  try { callback(); }
  catch (error) {
    // An interaction failure must not interrupt the scene or another control.
    setTimeout(() => { throw error; }, 0);
  }
}

function flush(time: number) {
  frame = 0;
  flushing = true;
  // Scene callbacks requested while flushing belong to the next display frame.
  for (const id of Array.from(sceneCallbacks.keys())) {
    const callback = sceneCallbacks.get(id);
    sceneCallbacks.delete(id);
    if (callback) invoke(() => callback(time));
  }
  // A scene update can mark interactions dirty. Consume them now, using the
  // new projection, rather than creating a second RAF one frame behind it.
  const pending = Array.from(dirtyInteractions);
  dirtyInteractions.clear();
  for (const callback of pending) {
    if (interactions.has(callback)) invoke(() => callback(projection, time));
  }
  flushing = false;
  if (sceneCallbacks.size || dirtyInteractions.size) ensureFrame();
}

/** A drop-in requestAnimationFrame scheduler for this page's scene. */
export function requestSceneFrame(callback: FrameRequestCallback) {
  const id = nextId++;
  sceneCallbacks.set(id, callback);
  ensureFrame();
  return id;
}

export function cancelHeroFrame(id: number) {
  sceneCallbacks.delete(id);
  cancelEmptyFrame();
}

/** Retained for controls that mount, resize or reactivate after the scene. */
export function getHeroScreenProjection() { return projection; }

export function setHeroScreenProjection(next: HeroScreenProjection | null) {
  projection = next;
  for (const callback of interactions) dirtyInteractions.add(callback);
  if (dirtyInteractions.size) ensureFrame();
}

export function registerHeroInteraction(callback: Interaction) {
  interactions.add(callback);
  dirtyInteractions.add(callback);
  ensureFrame();
  return {
    request() {
      if (!interactions.has(callback)) return;
      dirtyInteractions.add(callback);
      ensureFrame();
    },
    dispose() {
      interactions.delete(callback);
      dirtyInteractions.delete(callback);
      cancelEmptyFrame();
    },
  };
}
