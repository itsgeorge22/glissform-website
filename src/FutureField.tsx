import { useEffect, useRef } from 'react';
import { advanceField, createFieldParticles, FIELD_HEIGHT, FIELD_WIDTH } from './futureFieldMotion';

export default function FutureField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!field || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1156px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const particles = createFieldParticles();
    const pointer = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2, strength: 0 };
    const target = { x: pointer.x, y: pointer.y, strength: 0 };
    let inView = false;
    let contextLost = false;
    let frame = 0;
    let previousTime = 0;
    let waveTime = 0;

    const resetPointer = () => { target.strength = 0; };
    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      field.dataset.playing = 'false';
    };
    const canPlay = () => inView && desktop.matches && !document.hidden && !motion.matches && !contextLost;

    const draw = () => {
      context.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
      for (const dot of particles) {
        if (dot.alpha < .001) continue;
        context.globalAlpha = dot.alpha;
        context.fillStyle = dot.color;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      field.dataset.ready = 'true';
    };

    const tick = (timestamp: number) => {
      frame = 0;
      if (!canPlay()) return;
      const dt = previousTime ? Math.min((timestamp - previousTime) / 1000, 1 / 30) : 0;
      previousTime = timestamp;
      waveTime += dt;
      const follow = 1 - Math.exp(-dt * 18);
      pointer.x += (target.x - pointer.x) * follow;
      pointer.y += (target.y - pointer.y) * follow;
      pointer.strength += (target.strength - pointer.strength) * (1 - Math.exp(-dt * 7));
      advanceField(particles, waveTime, dt, pointer);
      field.dataset.waveState = 'flowing';
      draw();
      frame = window.requestAnimationFrame(tick);
    };

    const updatePlayback = () => {
      if (!canPlay()) {
        stop();
        resetPointer();
        pointer.strength = 0;
        for (const dot of particles) {
          dot.offsetX = dot.offsetY = dot.velocityX = dot.velocityY = dot.light = 0;
        }
        if (motion.matches || contextLost) field.dataset.ready = 'false';
      } else if (!frame) {
        field.dataset.playing = 'true';
        frame = window.requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      const bounds = field.getBoundingClientRect();
      if (!bounds.width || !bounds.height || contextLost) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * pixelRatio);
      const height = Math.round(bounds.height * pixelRatio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(width / FIELD_WIDTH, 0, 0, height / FIELD_HEIGHT, 0, 0);
      resetPointer();
      if (!motion.matches) {
        advanceField(particles, waveTime, 0, pointer);
        draw();
      }
      updatePlayback();
    };

    const move = (event: PointerEvent) => {
      if (!canPlay() || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = field.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width * FIELD_WIDTH;
      const y = (event.clientY - bounds.top) / bounds.height * FIELD_HEIGHT;
      // On entry, start the attraction where the pointer actually is, with no sweep from the old location.
      if (!target.strength && pointer.strength < .02) {
        pointer.x = x;
        pointer.y = y;
      }
      target.x = x;
      target.y = y;
      target.strength = 1;
    };
    const loseContext = () => { contextLost = true; updatePlayback(); };
    const restoreContext = () => { contextLost = false; resize(); };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    });
    const sizeObserver = new ResizeObserver(resize);
    observer.observe(field);
    sizeObserver.observe(field);
    field.addEventListener('pointerenter', move);
    field.addEventListener('pointermove', move);
    field.addEventListener('pointerleave', resetPointer);
    field.addEventListener('pointercancel', resetPointer);
    canvas.addEventListener('contextlost', loseContext);
    canvas.addEventListener('contextrestored', restoreContext);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('scroll', resetPointer, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', updatePlayback);
    motion.addEventListener('change', updatePlayback);
    desktop.addEventListener('change', updatePlayback);
    finePointer.addEventListener('change', resetPointer);
    resize();

    return () => {
      stop();
      field.dataset.ready = 'false';
      observer.disconnect();
      sizeObserver.disconnect();
      field.removeEventListener('pointerenter', move);
      field.removeEventListener('pointermove', move);
      field.removeEventListener('pointerleave', resetPointer);
      field.removeEventListener('pointercancel', resetPointer);
      canvas.removeEventListener('contextlost', loseContext);
      canvas.removeEventListener('contextrestored', restoreContext);
      window.removeEventListener('blur', resetPointer);
      window.removeEventListener('scroll', resetPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', updatePlayback);
      motion.removeEventListener('change', updatePlayback);
      desktop.removeEventListener('change', updatePlayback);
      finePointer.removeEventListener('change', resetPointer);
    };
  }, []);

  return <div ref={fieldRef} className="future-field" aria-hidden="true">
    <img className="future-field__still" src="/assets/future-field.svg?v=corner-depth-360" width={FIELD_WIDTH} height={FIELD_HEIGHT} alt="" draggable="false" />
    <canvas ref={canvasRef} className="future-field__canvas" width={FIELD_WIDTH} height={FIELD_HEIGHT} />
  </div>;
}
