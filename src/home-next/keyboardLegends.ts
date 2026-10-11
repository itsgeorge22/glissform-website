import { keyLegends } from './keyboardLayout.ts';

export type KeySurface = { id: string; width: number; height: number };
const cell = 128, columns = 8;

function icon(c: CanvasRenderingContext2D, name: string, x: number, y: number, size: number) {
  c.save(); c.translate(x - size / 2, y - size / 2); c.scale(size / 20, size / 20);
  c.lineWidth = 1.2; c.lineCap = 'round'; c.lineJoin = 'round';
  const line = (...points: number[]) => {
    c.beginPath(); c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
    c.stroke();
  };
  const circle = (cx: number, cy: number, radius: number) => { c.beginPath(); c.arc(cx, cy, radius, 0, Math.PI * 2); c.stroke(); };
  const triangle = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.stroke();
  };
  if (name.startsWith('brightness')) {
    circle(10, 10, 3.4);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      line(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8);
    }
  } else if (name === 'mission') {
    c.strokeRect(2, 3, 8, 5); c.strokeRect(3, 11, 7, 6); c.strokeRect(13, 4, 5, 12);
  } else if (name === 'search') { circle(8.5, 8.5, 5.5); line(12.5, 12.5, 17, 17); }
  else if (name === 'microphone') {
    c.beginPath(); c.roundRect(7, 2, 6, 11, 3); c.stroke();
    c.beginPath(); c.arc(10, 10, 5.5, 0, Math.PI); c.stroke(); line(10, 15.5, 10, 18); line(7, 18, 13, 18);
  } else if (name === 'moon') {
    c.stroke(new Path2D('M12 2C5 2 1 10 5 15C9 21 17 17 18 12C11 15 7 8 12 2Z'));
  } else if (name === 'rewind' || name === 'forward') {
    if (name === 'rewind') { c.translate(20, 0); c.scale(-1, 1); }
    triangle(2, 4, 9, 10, 2, 16); triangle(10, 4, 17, 10, 10, 16);
  } else if (name === 'play') { triangle(2, 4, 9, 10, 2, 16); line(13, 4, 13, 16); line(17, 4, 17, 16); }
  else if (name.startsWith('volume') || name === 'mute') {
    line(2, 7, 5, 7, 10, 3, 10, 17, 5, 13, 2, 13, 2, 7);
    if (name === 'mute') line(3, 2, 16, 18);
    else {
      c.beginPath(); c.arc(9, 10, 5.5, -.8, .8); c.stroke();
      if (name === 'volume-high') { c.beginPath(); c.arc(9, 10, 9, -.8, .8); c.stroke(); }
    }
  } else if (name === 'globe') {
    circle(10, 10, 8); c.beginPath(); c.ellipse(10, 10, 3.8, 8, 0, 0, Math.PI * 2); c.stroke();
    line(2, 10, 18, 10); line(4, 5.5, 16, 5.5); line(4, 14.5, 16, 14.5);
  }
  c.restore();
}

/** One static atlas for every key. Vector icons and text are rasterized once;
 * all legends then share one texture and one merged draw call. */
export function createKeyboardLegendAtlas(keys: KeySurface[]) {
  const canvas = document.createElement('canvas');
  canvas.width = cell * columns; canvas.height = cell * Math.ceil(keys.length / columns);
  const c = canvas.getContext('2d');
  if (!c) throw Error('Keyboard legend canvas unavailable');
  const regions = keys.map((key, index) => {
    const legend = keyLegends.get(key.id);
    if (!legend) throw Error(`Missing Mac keyboard legend: ${key.id}`);
    const left = index % columns * cell, top = Math.floor(index / columns) * cell;
    c.save(); c.translate(left, top); c.scale(cell / key.width, cell / key.height);
    c.fillStyle = '#dce1e7'; c.strokeStyle = '#dce1e7'; c.textBaseline = 'middle'; c.textAlign = 'center';
    const text = (value: string, x: number, y: number, size: number) => {
      c.font = `400 ${size}px Arial, sans-serif`; c.fillText(value, x, y);
    };
    const { width: w, height: h } = key;
    if (legend.icon === 'globe') {
      icon(c, 'globe', 10, h * .76, 8.8); text('fn', w - 9, h * .76, 7.5);
    } else if (legend.icon) {
      icon(c, legend.icon, w / 2, h * .39, legend.icon === 'brightness-low' ? 10 : 13);
      text(legend.label, w / 2, h * .79, 6.2);
    } else if (legend.symbol) {
      c.textAlign = legend.align === 'right' ? 'right' : 'left';
      const x = legend.align === 'right' ? w - 6 : 6;
      text(legend.symbol, x, h * .28, 12); text(legend.label, x, h * .77, 7.4);
    } else if (legend.shifted) {
      text(legend.shifted, w / 2, h * .3, 10.7); text(legend.label, w / 2, h * .71, 12.8);
    } else if (legend.align) {
      c.textAlign = legend.align === 'right' ? 'right' : 'left';
      text(legend.label, legend.align === 'right' ? w - 7 : 7, h * .74, key.id === 'escape' ? 8.5 : 13);
      if (key.id === 'caps-lock') { c.fillStyle = '#78818a'; c.beginPath(); c.arc(7, 7, 1.1, 0, Math.PI * 2); c.fill(); }
    } else if (legend.label) {
      text(legend.label, w / 2, h * .52, legend.kind === 'arrow' ? 7 : 13.5);
      if (key.id === 'F' || key.id === 'J') { c.fillStyle = '#68727b'; c.fillRect(w / 2 - 2.4, h - 6, 4.8, .65); }
    }
    c.restore();
    return { left: left / canvas.width, top: top / canvas.height, width: cell / canvas.width, height: cell / canvas.height };
  });
  return { canvas, regions };
}
