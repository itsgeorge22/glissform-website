/** Opt-in, development-only diagnostics. Callback spacing is not displayed FPS. */
export function mountFrameProbe() {
  const panel = document.createElement('aside');
  panel.style.cssText = 'position:fixed;z-index:10000;right:12px;top:12px;padding:10px;background:#10141eee;border:1px solid #ffffff33;border-radius:10px;color:white;font:12px/1.5 monospace;max-width:330px;max-height:calc(100vh - 24px);overflow:auto';
  panel.setAttribute('aria-label', 'Animation diagnostics');
  const button = document.createElement('button');
  button.textContent = 'Measure idle + close / open';
  button.style.cssText = 'padding:6px 10px;color:white;background:#263950;border:0;border-radius:5px;cursor:pointer';
  const freeze = document.createElement('button');
  freeze.textContent = 'Freeze visual sample';
  freeze.style.cssText = button.style.cssText + ';margin-top:6px';
  freeze.onclick = () => {
    document.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 1000; });
    freeze.disabled = true;
  };
  const loseGraphics = document.createElement('button');
  loseGraphics.textContent = 'Test graphics fallback';
  loseGraphics.style.cssText = freeze.style.cssText;
  loseGraphics.onclick = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.hero-animation__hardware');
    canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  };
  const output = document.createElement('output');
  output.style.cssText = 'display:block;white-space:pre-wrap;margin-top:8px';
  output.textContent = 'Callback timing only; use a browser trace for displayed frames.';
  panel.append(button, freeze, loseGraphics, output);
  document.body.append(panel);
  button.onclick = async () => {
    button.disabled = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const entries: { name: string; duration: number; blocking?: number; styleLayout?: number }[] = [];
    const observer = new PerformanceObserver(list => list.getEntries().forEach(entry => {
      const extended = entry as PerformanceEntry & { blockingDuration?: number; renderStart?: number; styleAndLayoutStart?: number };
      entries.push({ name: entry.entryType, duration: entry.duration, blocking: extended.blockingDuration,
        styleLayout: extended.styleAndLayoutStart ? entry.startTime + entry.duration - extended.styleAndLayoutStart : undefined });
    }));
    const types = PerformanceObserver.supportedEntryTypes.filter(type => ['longtask', 'long-animation-frame'].includes(type));
    if (types.length) observer.observe({ entryTypes: types });
    const sample = (motion: boolean) => new Promise<Record<string, number>>(resolve => {
      const intervals: number[] = [];
      let start = 0, previous = 0;
      const duration = motion ? 9000 : 3000;
      const distance = document.querySelector<HTMLElement>('.hero-animation')!.offsetHeight - innerHeight;
      const tick = (time: number) => {
        if (!start) start = previous = time;
        else intervals.push(time - previous);
        previous = time;
        const elapsed = time - start;
        if (motion) {
          const t = Math.min(1, elapsed / duration);
          const progress = .5 - .5 * Math.cos(t * Math.PI * 2);
          window.scrollTo({ top: distance * progress, behavior: 'instant' });
        }
        if (elapsed < duration) requestAnimationFrame(tick);
        else {
          const sorted = [...intervals].sort((a, b) => a - b);
          const percentile = (p: number) => +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(2);
          resolve({ callbacks: intervals.length, median: percentile(.5), p95: percentile(.95), max: percentile(1), over25ms: intervals.filter(ms => ms > 25).length });
        }
      };
      requestAnimationFrame(tick);
    });
    output.textContent = 'Measuring opening hero…';
    const idle = await sample(false);
    output.textContent = 'Measuring close and reverse…';
    const motion = await sample(true);
    observer.disconnect();
    window.scrollTo({ top: 0, behavior: 'instant' });
    const longFrames = entries.filter(e => e.name === 'long-animation-frame');
    const result = { viewport: [innerWidth, innerHeight, devicePixelRatio], idle, motion, longTasks: entries.filter(e => e.name === 'longtask').length,
      longFrames: longFrames.length, maxLongFrame: Math.max(0, ...longFrames.map(e => e.duration)),
      maxStyleLayout: Math.max(0, ...longFrames.map(e => e.styleLayout ?? 0)), elements: document.querySelectorAll('*').length };
    output.textContent = JSON.stringify(result, null, 2);
    button.disabled = false;
  };
}
