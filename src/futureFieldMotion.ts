import { futureFieldDots } from './futureFieldDots.ts';

export const FIELD_WIDTH = 1128;
export const FIELD_HEIGHT = 360;
export const FIELD_ORIGINAL_OFFSET_Y = (FIELD_HEIGHT - 282) / 2;
const TAU = Math.PI * 2;
const CURSOR_RADIUS = 180;
export const FIELD_BLEED = CURSOR_RADIUS + 60;
const COLUMN_SPACING = 22.49;
type FieldDot = (typeof futureFieldDots)[number];
type LayoutDot = { dot: FieldDot; flatY: number };
const ROW_SPACING = 16;

export interface FieldPointer {
  x: number;
  y: number;
  strength: number;
}

export interface FieldParticle {
  homeX: number;
  homeY: number;
  flatY: number;
  radius: number;
  opacity: number;
  red: number;
  green: number;
  blue: number;
  elevation: number;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
  light: number;
  x: number;
  y: number;
  alpha: number;
  color: string;
}

function smoothstep(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

/** Two short, stationary diagonal fades, confined to opposite corners. */
export function fieldDepthFade(x: number, y: number) {
  const topLeft = .35 + .65 * smoothstep((x + y) / 320);
  const bottomRight = .35 + .65 * smoothstep((FIELD_WIDTH - x + FIELD_HEIGHT - y) / 320);
  return topLeft * bottomRight;
}

function extendField(): LayoutDot[] {
  // Continue the original curved columns beyond every side of the viewport.
  // Their offscreen rows remain in the simulation and can be pulled into view.
  const columns = new Map<number, FieldDot[]>();
  for (const dot of futureFieldDots) {
    const index = Math.round((dot[0] - 1.739) / COLUMN_SPACING);
    const column = columns.get(index) ?? [];
    column.push(dot);
    columns.set(index, column);
  }
  const result: LayoutDot[] = [];
  const extraColumns = Math.ceil(FIELD_BLEED / COLUMN_SPACING);
  for (let index = -extraColumns; index <= 50 + extraColumns; index++) {
    const sourceIndex = Math.max(0, Math.min(50, index));
    const source = [...columns.get(sourceIndex)!].sort((a, b) => a[1] - b[1]);
    const column = source.map(([x, y, ...rest]) => [x + (index - sourceIndex) * COLUMN_SPACING, y + FIELD_ORIGINAL_OFFSET_Y, ...rest] as FieldDot);
    const flatTop = FIELD_HEIGHT / 2 - (column.length - 1) / 2 * ROW_SPACING;
    result.push(...column.map((dot, row) => ({ dot, flatY: flatTop + row * ROW_SPACING })));
    const first = column[0];
    const last = column[column.length - 1];
    const topStep = column[1][1] - first[1];
    const bottomStep = last[1] - column[column.length - 2][1];
    for (let row = 1; first[1] - row * topStep > -FIELD_BLEED || flatTop - row * ROW_SPACING > -FIELD_BLEED; row++) {
      result.push({ dot: [first[0], first[1] - row * topStep, first[2], first[3], first[4], first[5], first[6]], flatY: flatTop - row * ROW_SPACING });
    }
    const flatBottom = flatTop + (column.length - 1) * ROW_SPACING;
    for (let row = 1; last[1] + row * bottomStep < FIELD_HEIGHT + FIELD_BLEED || flatBottom + row * ROW_SPACING < FIELD_HEIGHT + FIELD_BLEED; row++) {
      result.push({ dot: [last[0], last[1] + row * bottomStep, last[2], last[3], last[4], last[5], last[6]], flatY: flatBottom + row * ROW_SPACING });
    }
  }
  return result;
}

let extendedDots: LayoutDot[] | undefined;

export function createFieldParticles(): FieldParticle[] {
  return (extendedDots ??= extendField()).map(({ dot: [x, y, radius, opacity, red, green, blue], flatY }) => ({
    homeX: x, homeY: y, flatY, radius, opacity, red, green, blue,
    elevation: 0,
    offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0, light: 0,
    x, y, alpha: opacity, color: `rgb(${red}, ${green}, ${blue})`,
  }));
}

/** The wave continues independently of the magnetic cursor response. */
export function advanceField(particles: FieldParticle[], time: number, elapsed: number, pointer: FieldPointer) {
  const dt = Math.min(Math.max(elapsed, 0), 1 / 30);
  // Exact damped-spring integration keeps a fast reversal stable at different refresh rates.
  const damping = 11;
  const frequency = 10;
  const decay = Math.exp(-damping * dt);
  const cos = Math.cos(frequency * dt);
  const sin = Math.sin(frequency * dt);
  const lightBlend = 1 - Math.exp(-dt * (pointer.strength > .01 ? 11 : 5.5));

  for (const dot of particles) {
    const baseY = dot.homeY;
    // Preserve the earlier left-to-right wave; diagonal depth belongs to the
    // stationary corner fades, rather than changing the direction of travel.
    const originalY = dot.homeY - FIELD_ORIGINAL_OFFSET_Y;
    const phase = dot.homeX / 880 * TAU - time / 7.2 * TAU + originalY / 282 * 2.4;
    const elevation = (Math.sin(phase) * .82 + Math.sin(phase * .55 - originalY / 190 - time * .24) * .18);
    // Positive height lifts the sheet toward the viewer. Perspective spreads
    // the raised rows slightly, while their blue follows that same height.
    const waveY = -elevation * 24 + (dot.homeY - FIELD_HEIGHT / 2) * elevation * .025;
    const waveX = Math.cos(phase) * 3 + (dot.homeX - FIELD_WIDTH / 2) * elevation * .008;
    const crest = smoothstep((elevation + 1) / 2);
    const dx = pointer.x - dot.homeX - waveX;
    const dy = pointer.y - baseY - waveY;
    const proximity = smoothstep(1 - Math.hypot(dx, dy) / CURSOR_RADIUS);
    const influence = proximity * pointer.strength;
    const targetX = dx * influence * .3;
    const targetY = dy * influence * .3;

    const errorX = dot.offsetX - targetX;
    const errorY = dot.offsetY - targetY;
    const sineX = (dot.velocityX + damping * errorX) / frequency;
    const sineY = (dot.velocityY + damping * errorY) / frequency;
    dot.offsetX = targetX + decay * (errorX * cos + sineX * sin);
    dot.offsetY = targetY + decay * (errorY * cos + sineY * sin);
    dot.velocityX = decay * (dot.velocityX * cos - (damping * sineX + frequency * errorX) * sin);
    dot.velocityY = decay * (dot.velocityY * cos - (damping * sineY + frequency * errorY) * sin);
    dot.light += (influence - dot.light) * lightBlend;
    dot.elevation = elevation;
    dot.x = dot.homeX + waveX + dot.offsetX;
    dot.y = baseY + waveY + dot.offsetY;

    // Fade by rendered position, never by which row a dot started on. The
    // fade stays still while the extended sheet moves beneath it, hiding its ends.
    const edgeFade = smoothstep(Math.min(dot.x, FIELD_WIDTH - dot.x) / 130)
      * smoothstep(Math.min(dot.y, FIELD_HEIGHT - dot.y) / 48);
    const baseOpacity = .18 + dot.opacity * .38;
    const light = 1 - (1 - crest * .78) * (1 - dot.light * .97);
    dot.alpha = edgeFade * fieldDepthFade(dot.x, dot.y)
      * (baseOpacity + (1 - baseOpacity) * Math.min(1, crest * .48 + dot.light * .48));
    const red = Math.round(145 + (8 - 145) * light);
    const green = Math.round(171 + (119 - 171) * light);
    const blue = Math.round(202 + (245 - 202) * light);
    dot.color = `rgb(${red}, ${green}, ${blue})`;
  }
}
