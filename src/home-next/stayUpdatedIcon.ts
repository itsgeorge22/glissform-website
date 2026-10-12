/** Original Figma artwork; separate paths allow the requested arrow/shelf morph. */
type Point = [number, number];
type Segment = [Point, Point, Point];
const center = 19.2771;
const radius = 12.8514;
const shelfStart: Point = [6.4257, 24.5608];
// Centerline of the exported shelf. The 3.21285-wide round stroke follows
// its existing inner/outer contours. Curl into the lower arc while the whole
// shelf turns clockwise, instead of stretching both arms into a near-circle.
const shelf: Segment[] = [
  [[6.4257, 25.4443], [6.4257, 26.3279], [6.4257, 27.2114]],
  [[6.4257, 30.1478], [8.8075, 32.52865], [11.7446, 32.52865]],
  [[16.7668, 32.52865], [21.789, 32.52865], [26.8112, 32.52865]],
  [[29.7477, 32.52865], [32.1285, 30.1478], [32.1285, 27.2114]],
  [[32.1285, 26.3279], [32.1285, 25.4443], [32.1285, 24.5608]],
];
const onCircle = (angle: number): Point => [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
const firstAngle = 160 * Math.PI / 180;
const arc = -140 * Math.PI / 180 / shelf.length;
const circleStart = onCircle(firstAngle);
const circle: Segment[] = shelf.map((_, index) => {
  const a = firstAngle + index * arc, b = a + arc, k = 4 / 3 * Math.tan(arc / 4);
  const from = onCircle(a), to = onCircle(b);
  return [[from[0] - k * radius * Math.sin(a), from[1] + k * radius * Math.cos(a)],
    [to[0] + k * radius * Math.sin(b), to[1] - k * radius * Math.cos(b)], to];
});

const interpolate = (a: Point, b: Point, progress: number): Point => [
  a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress,
];
const checkLeft: Point = [8.5, 19.5], checkCorner: Point = [16, 27], checkRight: Point = [30, 10.5];
export function updateLoaderPath(morph: number) {
  const mix = (a: Point, b: Point) => interpolate(a, b, morph).map(v => v.toFixed(4)).join(' ');
  return `M${mix(shelfStart, circleStart)} ` + shelf.map((segment, index) =>
    `C${segment.map((point, part) => mix(point, circle[index][part])).join(' ')}`).join(' ');
}

/** One continuous clockwise track: the existing arc, a tangent exit, then the check. */
export function updateCheckRoute(spinnerAngle: number) {
  // The group keeps its final rotation. Convert the upright check to that frame
  // so the line can travel into it without moving or replacing the existing arc.
  const angle = -spinnerAngle * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  const local = (point: Point): Point => {
    const x = point[0] - center, y = point[1] - center;
    return [center + x * cos - y * sin, center + x * sin + y * cos];
  };
  // Enter at the nearby upper-right tip, descend the long arm, then finish left.
  const start = local(checkRight), corner = local(checkCorner), end = local(checkLeft);
  // The shelf's path runs counterclockwise, but the loader rotates clockwise.
  // Reverse its cubic traversal (not its visible shape) before feeding the check.
  const clockwiseStart = circle[circle.length - 1][2];
  const clockwise = circle.map((_, index): Segment => {
    const original = circle.length - 1 - index;
    return [circle[original][1], circle[original][0], original === 0 ? circleStart : circle[original - 1][2]];
  });
  const arcEnd = circleStart;
  const entryLength = Math.hypot(corner[0] - start[0], corner[1] - start[1]);
  const handle = Math.min(6, Math.hypot(start[0] - arcEnd[0], start[1] - arcEnd[1]) * .5);
  const exit: Point = [arcEnd[0] - Math.sin(firstAngle) * handle, arcEnd[1] + Math.cos(firstAngle) * handle];
  const entry: Point = [start[0] - (corner[0] - start[0]) / entryLength * handle,
    start[1] - (corner[1] - start[1]) / entryLength * handle];
  const point = (p: Point) => p.map(v => v.toFixed(4)).join(' ');
  const clockwisePath = `M${point(clockwiseStart)} ` + clockwise.map(segment => `C${segment.map(point).join(' ')}`).join(' ');
  return {
    path: `${clockwisePath} C${point(exit)} ${point(entry)} ${point(start)} L${point(corner)} L${point(end)}`,
    checkLength: entryLength + Math.hypot(end[0] - corner[0], end[1] - corner[1]),
  };
}
export const updateArrowPath = 'M18.0903 24.7438C18.1047 24.7614 18.1224 24.7775 18.1401 24.7952C18.275 24.9333 18.4324 25.041 18.6011 25.1197L18.6043 25.1213C18.6333 25.1341 18.6622 25.147 18.6927 25.1582C18.8582 25.2225 19.0349 25.261 19.2228 25.2675H19.2276C19.2405 25.2691 19.2549 25.2691 19.2678 25.2691H19.2774C19.3015 25.2691 19.3256 25.2675 19.3481 25.2675H19.3513C19.5393 25.2578 19.7192 25.2177 19.8863 25.1486C19.9136 25.139 19.9425 25.1261 19.9698 25.1116H19.973C20.1337 25.0345 20.2831 24.9285 20.4148 24.7968C20.4325 24.7791 20.4501 24.7614 20.4662 24.7438L26.2156 18.5542C26.8196 17.9052 26.7827 16.8884 26.132 16.2843C25.4831 15.6803 24.4662 15.7189 23.8622 16.3679L20.8839 19.5727V6.82731C20.8839 5.93896 20.1658 5.22088 19.2774 5.22088C18.3907 5.22088 17.671 5.93896 17.671 6.82731V19.5727L14.6927 16.3679C14.0887 15.7173 13.0718 15.6787 12.4228 16.2843C11.7722 16.8884 11.7353 17.9052 12.3393 18.5542L18.0903 24.7438Z';
export const updateShelfPath = 'M32.1285 22.9544C31.2418 22.9544 30.5221 23.6741 30.5221 24.5608V27.2114C30.5221 29.258 28.8578 30.9222 26.8112 30.9222H11.7446C9.69799 30.9222 8.03213 29.258 8.03213 27.2114V24.5608C8.03213 23.6741 7.31406 22.9544 6.4257 22.9544C5.53896 22.9544 4.81928 23.6741 4.81928 24.5608V27.2114C4.81928 31.0283 7.9261 34.1351 11.7446 34.1351H26.8112C30.6281 34.1351 33.7349 31.0283 33.7349 27.2114V24.5608C33.7349 23.6741 33.0153 22.9544 32.1285 22.9544Z';
