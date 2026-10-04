export type PlanePoint = { x: number; y: number };
export type PlaneQuad = readonly [PlanePoint, PlanePoint, PlanePoint, PlanePoint];

/** Invert the projected corners of a live DOM plane. The corners are ordered
 * clockwise from its top left; no assumption is made about the camera or lid. */
export function unprojectPlanePoint(point: PlanePoint, corners: PlaneQuad, width: number, height: number): PlanePoint | null {
  if (![point.x, point.y, width, height, ...corners.flatMap(p => [p.x, p.y])].every(Number.isFinite)
    || width <= 0 || height <= 0) return null;
  const [origin, ...rest] = corners;
  const [p1, p2, p3] = rest.map(p => ({ x: p.x - origin.x, y: p.y - origin.y }));
  const points = [{ x: 0, y: 0 }, p1, p2, p3];
  const edges = points.map((p, i) => ({ x: points[(i + 1) % 4].x - p.x, y: points[(i + 1) % 4].y - p.y }));
  const crosses = edges.map((p, i) => p.x * edges[(i + 1) % 4].y - p.y * edges[(i + 1) % 4].x);
  const scale = Math.max(...edges.map(p => p.x * p.x + p.y * p.y));
  // An edge-on, crossed or vanishing plane must never produce enormous input.
  if (scale < 1 || !crosses.every(value => Math.abs(value) > scale * 1e-5 && Math.sign(value) === Math.sign(crosses[0]))) return null;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
  const sx = p2.x - p1.x - p3.x, sy = p2.y - p1.y - p3.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(determinant) < scale * 1e-8) return null;
  const g = (sx * dy2 - dx2 * sy) / determinant;
  const h = (dx1 * sy - sx * dy1) / determinant;
  if (Math.min(1 + g, 1 + h, 1 + g + h) <= 1e-6) return null;
  const x = point.x - origin.x, y = point.y - origin.y;
  const a = p1.x * (1 + g) - x * g, b = p3.x * (1 + h) - x * h;
  const d = p1.y * (1 + g) - y * g, e = p3.y * (1 + h) - y * h;
  const inverseDeterminant = a * e - b * d;
  if (Math.abs(inverseDeterminant) < scale * 1e-8) return null;
  const local = { x: (x * e - b * y) / inverseDeterminant * width, y: (a * y - x * d) / inverseDeterminant * height };
  return Number.isFinite(local.x) && Number.isFinite(local.y) ? local : null;
}
