export type ReturnPhase = 'folded' | 'preparing' | 'waiting' | 'returning' | 'returned';

const folded = 18;
const connected = 0;
const returnDuration = 600;

type Options = {
  fold: HTMLElement;
  connection: HTMLElement;
  onPhase: (phase: ReturnPhase) => void;
  reducedMotion: () => boolean;
  render: (degrees: number) => void;
  schedule?: typeof setTimeout;
  unschedule?: typeof clearTimeout;
  requestFrame?: typeof requestAnimationFrame;
  cancelFrame?: typeof cancelAnimationFrame;
};

export function createDesktopReturnPreview({ fold, connection, onPhase, reducedMotion, render, schedule = setTimeout, unschedule = clearTimeout, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }: Options) {
  let phase: ReturnPhase = 'folded';
  let enabled = true;
  let disposed = false;
  let generation = 0;
  let waitAfterPreparation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let screenAnimation: Animation | undefined;
  let connectionAnimation: Animation | undefined;
  let drawFrame: number | undefined;
  let pose = folded;
  const setPhase = (next: ReturnPhase) => { phase = next; onPhase(next); };
  const setPose = (degrees: number) => { pose = degrees; render(degrees); };
  const stopScreen = () => {
    if (drawFrame !== undefined) cancelFrame(drawFrame);
    drawFrame = undefined;
    screenAnimation?.cancel();
    screenAnimation = undefined;
  };
  const animatePose = (from: number, to: number, duration: number, easing: string) => {
    // Use the browser's eased animation clock to drive the same screen-local
    // projection as the MacBook demo. The canvas itself never moves or fades.
    const animation = fold.animate([{}, {}], { duration, easing, fill: 'forwards' });
    const draw = () => {
      if (disposed || screenAnimation !== animation) return;
      const progress = animation.effect?.getComputedTiming().progress ?? 0;
      setPose(from + (to - from) * progress);
      drawFrame = requestFrame(draw);
    };
    drawFrame = requestFrame(draw);
    return animation;
  };
  const clearConnection = () => {
    connectionAnimation?.cancel();
    connectionAnimation = undefined;
    connection.style.opacity = '0';
  };
  const cancel = () => {
    generation++;
    if (timer !== undefined) unschedule(timer);
    timer = undefined;
    stopScreen();
    clearConnection();
  };
  const finishReturn = (run: number) => {
    if (disposed || run !== generation) return;
    setPose(connected);
    stopScreen();
    setPhase('returned');
  };
  const returnScreen = () => {
    if (timer !== undefined) unschedule(timer);
    timer = undefined;
    const run = generation;
    setPhase('returning');
    if (reducedMotion()) { finishReturn(run); return; }
    // One wallpaper is reprojected and sharpens continuously inside the frame.
    screenAnimation = animatePose(folded, connected, returnDuration, 'cubic-bezier(.4, 0, .2, 1)');
    if (enabled) {
      // Preserve a broad, soft pulse. Its peak shares the screen's contact time:
      // 250 ms lead-in + 350 ms rise = the 600 ms return duration.
      connectionAnimation = connection.animate([
        { opacity: 0, easing: 'ease-out' },
        { opacity: .85, offset: 350 / 850, easing: 'ease-out' },
        { opacity: 0 },
      ], { delay: 250, duration: 850, easing: 'linear' });
    }
    screenAnimation.finished.then(() => finishReturn(run), () => {});
  };
  const waitOrReturn = () => {
    if (!waitAfterPreparation) { returnScreen(); return; }
    setPhase('waiting');
    const run = generation;
    timer = schedule(() => { if (!disposed && run === generation) returnScreen(); }, waitAfterPreparation);
  };
  const start = (wait: number) => {
    const replay = phase === 'returned';
    cancel();
    waitAfterPreparation = wait;
    if (replay && !reducedMotion()) {
      // Replays ease back into the demonstration instead of snapping to blur.
      setPhase('preparing');
      const run = generation;
      screenAnimation = animatePose(connected, folded, 360, 'ease-in-out');
      screenAnimation.finished.then(() => {
        if (disposed || run !== generation) return;
        setPose(folded);
        stopScreen();
        waitOrReturn();
      }, () => {});
    } else {
      setPose(folded);
      waitOrReturn();
    }
  };
  setPose(folded);
  return {
    redraw() { if (!disposed) render(pose); },
    pause() {
      if (disposed || phase === 'preparing' || phase === 'waiting' || phase === 'returning') return;
      start(1000);
    },
    escape() {
      if (disposed || phase === 'returning') return;
      if (phase === 'preparing') { waitAfterPreparation = 0; return; }
      if (phase === 'waiting') { returnScreen(); return; }
      start(0);
    },
    setConnectionEnabled(value: boolean) {
      enabled = value;
      if (!enabled) clearConnection();
    },
    reset() {
      if (disposed) return;
      cancel();
      setPose(folded);
      setPhase('folded');
    },
    dispose() { disposed = true; cancel(); },
  };
}
