import {
  ACESFilmicToneMapping, Box3, BufferGeometry, CanvasTexture, DirectionalLight, DoubleSide,
  Float32BufferAttribute, Group, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, Scene, ShapeUtils, SRGBColorSpace, Vector2,
  WebGLRenderer, type Material, type Texture, type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { macBookDimensions } from './displayGeometry.ts';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createKeyboardLegendAtlas } from './keyboardLegends.ts';
import details from './macbook-details.json' with { type: 'json' };
export { macBookDimensions } from './displayGeometry.ts';

// The current homepage's native drawing proportions and hinge coordinates.
const { width: W, depth: D, radius: R } = macBookDimensions;
const lidCorners = [R, R, macBookDimensions.lidBottomRadius, macBookDimensions.lidBottomRadius] as const;
const L = (900 - W) / 2;
// Keep a visible rear shelf and a narrow gap before the original trackpad.
const keyboardPlacement = { side: 86, rear: 72, depth: 240, padding: 4, recess: 1.8 };
type Point = [number, number, number];
type Ring = { z: number; inset: number };
type Mapper = (x: number, y: number, z: number) => Point;
type CornerRadius = number | readonly [number, number, number, number];
type KeyLayout = { id: string; x: number; y: number; width: number; height: number; touchID: boolean; arrow: boolean };

export type ThreeHardwarePose = {
  fold: number;
  /** CSS column-major transform: native rig coordinates into stage CSS pixels.
   * The caller includes the hinge origin, but excludes stage perspective. */
  modelMatrix: ArrayLike<number>;
  perspective: number;
  elevation?: number;
  opacity?: number;
  shadowOpacity?: number;
};
export type ThreeHardwareRenderer = {
  resize(width: number, height: number, dpr: number): void;
  render(pose: ThreeHardwarePose): boolean;
  dispose(): void;
};

const lidPoint: Mapper = (x, y, z) => [L + x - 450, y - D, z];
const deckPoint: Mapper = (x, y, z) => [L + x, D + 3 + z, D - y];

function perimeter(width: number, height: number, radius: CornerRadius, inset = 0, segments = 8) {
  const [tl, tr, br, bl] = typeof radius === 'number' ? [radius, radius, radius, radius] : radius;
  return [[tl, tl, Math.PI, tl], [width - tr, tr, Math.PI * 1.5, tr],
    [width - br, height - br, 0, br], [bl, height - bl, Math.PI * .5, bl]]
    .flatMap(([x, y, start, r]) => Array.from({ length: segments + 1 }, (_, index) => {
      const angle = start + index / segments * Math.PI / 2;
      return [x + (r - inset) * Math.cos(angle), y + (r - inset) * Math.sin(angle)];
    }));
}

function geometry(positions: number[], indices: number[], uv?: number[]) {
  const result = new BufferGeometry();
  result.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (uv) result.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  result.setIndex(indices); result.computeVertexNormals();
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}

/** Split finishes at exact cross-sections while preserving the surface normals. */
function colorHingeCover(source: BufferGeometry, ranges: number[][], mapX = (x: number) => x) {
  const position = source.getAttribute('position'), normal = source.getAttribute('normal');
  const index = source.getIndex();
  type Vertex = { position: Point; normal: Point };
  const vertex = (i: number): Vertex => {
    const n = index ? index.getX(i) : i;
    const x = position.getX(n);
    return { position: [mapX(x), position.getY(n), position.getZ(n)],
      normal: [normal.getX(n), normal.getY(n), normal.getZ(n)] };
  };
  const clip = (polygon: Vertex[], edge: number, keepRight: boolean) => {
    const result: Vertex[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[(i + polygon.length - 1) % polygon.length], b = polygon[i];
      const aInside = keepRight ? a.position[0] >= edge : a.position[0] <= edge;
      const bInside = keepRight ? b.position[0] >= edge : b.position[0] <= edge;
      if (aInside !== bInside) {
        const t = (edge - a.position[0]) / (b.position[0] - a.position[0]);
        result.push({
          position: a.position.map((value, axis) => value + (b.position[axis] - value) * t) as Point,
          normal: a.normal.map((value, axis) => value + (b.normal[axis] - value) * t) as Point,
        });
      }
      if (bInside) result.push(b);
    }
    return result;
  };
  const positions: number[] = [], normals: number[] = [];
  const result = new BufferGeometry();
  for (const [start, end, materialIndex] of ranges) {
    const offset = positions.length / 3;
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const polygon = clip(clip([vertex(i), vertex(i + 1), vertex(i + 2)], start, true), end, false);
      for (let j = 1; j < polygon.length - 1; j++) {
        for (const v of [polygon[0], polygon[j], polygon[j + 1]]) {
          positions.push(...v.position); normals.push(...v.normal);
        }
      }
    }
    result.addGroup(offset, positions.length / 3 - offset, materialIndex);
  }
  result.setAttribute('position', new Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}

/** Continue the original lid-side profile, keeping its center dark. */
function extendHingeCover(source: BufferGeometry, leftEnd: number, rightEnd: number) {
  source.computeBoundingBox();
  const { min, max } = source.boundingBox!;
  const leftExtension = leftEnd - min.x, rightExtension = rightEnd - max.x;
  const left = min.x + leftExtension * .30, right = max.x + rightExtension * .30;
  return colorHingeCover(source, [[leftEnd, left, 1], [left, right, 0], [right, rightEnd, 1]],
    x => x + (x < 0 ? leftExtension : x > 0 ? rightExtension : 0));
}

function face(width: number, height: number, radius: CornerRadius, z: number, map: Mapper,
  reverse = false, inset = 0, flipU = false) {
  const points = [[width / 2, height / 2], ...perimeter(width, height, radius, inset)];
  const positions = points.flatMap(([x, y]) => map(x, y, z));
  const uv = points.flatMap(([x, y]) => [flipU ? 1 - x / width : x / width, y / height]);
  const indices: number[] = [];
  for (let index = 1; index < points.length; index++) {
    const next = index === points.length - 1 ? 1 : index + 1;
    indices.push(...(reverse ? [0, next, index] : [0, index, next]));
  }
  return geometry(positions, indices, uv);
}

function shell(width: number, height: number, radius: CornerRadius, rings: Ring[], map: Mapper,
  outline = (inset: number) => perimeter(width, height, radius, inset)) {
  const positions: number[] = [], indices: number[] = [];
  const count = outline(0).length;
  for (const ring of rings) positions.push(...outline(ring.inset).flatMap(([x, y]) => map(x, y, ring.z)));
  const reverse = rings.at(-1)!.z < rings[0].z;
  for (let ring = 0; ring < rings.length - 1; ring++) for (let index = 0; index < count; index++) {
    const next = (index + 1) % count;
    const a = ring * count + index, b = ring * count + next;
    const c = (ring + 1) * count + next, d = (ring + 1) * count + index;
    indices.push(...(reverse ? [a, c, b, a, d, c] : [a, b, c, a, c, d]));
  }
  return geometry(positions, indices);
}

function deckFace(outline: number[][], z: number, map: Mapper, holes: number[][][] = []) {
  const vectors = (points: number[][]) => points.map(([x, y]) => new Vector2(x, y));
  const points = [...outline, ...holes.flat()];
  const triangles = ShapeUtils.triangulateShape(vectors(outline), holes.map(vectors));
  const indices = triangles.flatMap(([a, b, c]) => {
    const [ax, ay] = points[a], [bx, by] = points[b], [cx, cy] = points[c];
    // The deck mapper reverses native y, so clockwise contours face upward.
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) > 0 ? [a, c, b] : [a, b, c];
  });
  return geometry(points.flatMap(([x, y]) => map(x, y, z)), indices);
}

const fingerRecess = details.scoop;
function sampleProfile(points: number[][], x: number) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) if (x <= points[i][0]) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    return ay + (by - ay) * (x - ax) / (bx - ax);
  }
  return points.at(-1)![1];
}
function recessDrop(x: number, y: number) {
  const left = (W - fingerRecess.width) / 2;
  if (x <= left || x >= W - left) return 0;
  const drop = sampleProfile(fingerRecess.frontProfile, x);
  const reach = sampleProfile(fingerRecess.topContour, x);
  return drop * Math.max(0, 1 - y / Math.max(.01, reach));
}

/** Apple's curved finger opening, fitted to our original recess envelope. */
function createFingerRecess() {
  return geometry(fingerRecess.positions, fingerRecess.indices);
}

/** The Touch ID sensor sits below a cut-out in the black key, not on a disc. */
export function createMacBookTouchID(key: Pick<KeyLayout, 'x' | 'y' | 'width' | 'height'>) {
  const { width, height } = key, radius = Math.min(11, width * .3, height * .3);
  const map: Mapper = (x, y, z) => deckPoint(key.x + x, key.y + y, z);
  const disc: Mapper = (x, y, z) => map(width / 2 - radius + x, height / 2 - radius + y, z);
  const hole = Array.from({ length: 64 }, (_, index) => {
    const angle = index / 64 * Math.PI * 2;
    return [width / 2 + radius * Math.cos(angle), height / 2 + radius * Math.sin(angle)];
  });
  const wall = shell(radius * 2, radius * 2, radius, [
    { z: -2.6, inset: 0 }, { z: -2.55, inset: .12 },
    { z: -2.23, inset: .5 }, { z: -2.15, inset: .7 },
  ], disc);
  const indices = wall.getIndex()!;
  for (let index = 0; index < indices.count; index += 3) {
    const b = indices.getX(index + 1); indices.setX(index + 1, indices.getX(index + 2)); indices.setX(index + 2, b);
  }
  wall.computeVertexNormals();
  return {
    top: deckFace(perimeter(width, height, 5, .55), -2.6, map, [hole]),
    wall,
    sensor: face(radius * 2, radius * 2, radius, -2.15, disc, true, .7),
  };
}

/** Pure geometry factory also used to verify the physical shell and face normals. */
export function createMacBookEnclosure() {
  const baseRings = [{ z: 0, inset: 0, angle: 0 }, ...Array.from({ length: 13 }, (_, index) => {
    const angle = index * Math.PI / 24;
    return { z: 6 + 11 * Math.sin(angle), inset: 11 * (1 - Math.cos(angle)), angle };
  })];
  const left = (W - fingerRecess.width) / 2, right = W - left;
  const deckOutline = perimeter(W, D, R);
  // The Air's rear shelf covers the mounts; only the rotating clutch needs a
  // clearance slot. A deep open pocket exposes the mounting arms unnecessarily.
  deckOutline.splice(27, 0, [W / 2 + 316, D], [W / 2 + 316, D - 8], [W / 2 - 316, D - 8], [W / 2 - 316, D]);
  deckOutline.splice(9, 0, [left, 0], ...fingerRecess.topContour, [right, 0]);
  const baseOutline = (inset: number) => {
    const points = perimeter(W, D, R, inset, 16);
    points.splice(17, 0, ...[left, ...fingerRecess.frontProfile.map(p => p[0]), right].map(x => [x, inset]));
    return points;
  };
  const base = shell(W, D, R, baseRings, (x, y, z) =>
    deckPoint(x, y, z + recessDrop(x, y) * Math.max(0, 1 - z / 6)), baseOutline);
  // Exact surface normals keep the broad front wall planar. Averaging long
  // triangles with corner/scoop faces made the aluminium look dented/wavy.
  const normals = baseRings.flatMap(ring => baseOutline(ring.inset).flatMap(([x, y]) => {
    const nx = x - Math.max(R, Math.min(W - R, x)), ny = y - Math.max(R, Math.min(D - R, y));
    const length = Math.hypot(nx, ny), horizontal = Math.cos(ring.angle);
    return [nx / length * horizontal, Math.sin(ring.angle), -ny / length * horizontal];
  }));
  base.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  const { side, rear, depth, padding, recess } = keyboardPlacement;
  const wellWidth = W - side * 2 + padding * 2, wellDepth = depth + padding * 2;
  const wellMap: Mapper = (x, y, z) => deckPoint(side - padding + x, D - rear - depth - padding + y, z);
  const wellOutline = perimeter(wellWidth, wellDepth, 8);
  const wellHole = wellOutline.map(([x, y]) => [side - padding + x, D - rear - depth - padding + y]);
  const wellWall = shell(wellWidth, wellDepth, 8, [
    { z: 0, inset: 0 }, { z: .22, inset: .45 },
    { z: recess - .35, inset: 1.25 }, { z: recess, inset: 1.8 },
  ], wellMap);
  // This is an inward-facing recess, so reverse the shell's outside winding.
  const wallIndices = wellWall.getIndex()!;
  for (let i = 0; i < wallIndices.count; i += 3) {
    const b = wallIndices.getX(i + 1); wallIndices.setX(i + 1, wallIndices.getX(i + 2)); wallIndices.setX(i + 2, b);
  }
  wellWall.computeVertexNormals();
  return {
    deck: deckFace(deckOutline, 0, deckPoint, [wellHole]),
    keyboardFloor: face(wellWidth, wellDepth, 8, recess, wellMap, true, 1.8),
    keyboardWall: wellWall,
    scoop: createFingerRecess(),
    base,
    underside: face(W, D, R, 17, deckPoint, false, 11),
    front: face(W, D, lidCorners, 0, lidPoint, false, 1.1),
    rim: face(W, D, lidCorners, -.1, lidPoint),
    back: face(W, D, lidCorners, -6, lidPoint, true, .65),
    lid: shell(W, D, lidCorners, [
      { z: -6, inset: .65 }, { z: -5.2, inset: .15 }, { z: -4.6, inset: 0 },
      { z: -1.2, inset: 0 }, { z: -.3, inset: 0 }, { z: 0, inset: 0 },
    ], lidPoint),
  };
}

/** Exact CSS camera conversion: x right, y down, positive z toward the eye. */
export function configureThreeCamera(camera: PerspectiveCamera, width: number, height: number, perspective: number, padding = 0) {
  camera.fov = 2 * Math.atan(height / (2 * perspective)) * 180 / Math.PI;
  camera.aspect = width / height;
  camera.near = perspective * .05; camera.far = perspective * 8;
  camera.position.set(width / 2, -height / 2, perspective);
  camera.lookAt(width / 2, -height / 2, 0);
  if (padding) camera.setViewOffset(width, height, -padding, -padding, width + padding * 2, height + padding * 2);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
}

function keyboardLayout(template: HTMLElement): KeyLayout[] {
  const keyboard = template.querySelector<HTMLElement>('.seamless-macbook__keyboard');
  if (!keyboard?.offsetWidth || !keyboard.offsetHeight) throw Error('MacBook keyboard template must retain its layout while initializing');
  return Array.from(keyboard.querySelectorAll<HTMLElement>('.seamless-macbook__key'), key => {
    let x = 0, y = 0;
    for (let node: HTMLElement | null = key; node && node !== keyboard; node = node.offsetParent as HTMLElement | null) {
      x += node.offsetLeft; y += node.offsetTop;
    }
    const style = getComputedStyle(key), width = parseFloat(style.width), height = parseFloat(style.height);
    const depthScale = keyboardPlacement.depth / keyboard.offsetHeight;
    return { id: key.dataset.keyId ?? '', x: keyboardPlacement.side + x,
      y: D - keyboardPlacement.rear - (y + height) * depthScale, width, height: height * depthScale,
      touchID: key.classList.contains('seamless-macbook__key--touch-id'), arrow: key.classList.contains('seamless-macbook__key--arrow') };
  });
}

function loadLogo(signal: AbortSignal): Promise<HTMLImageElement | null> {
  if (signal.aborted) return Promise.resolve(null);
  return new Promise(resolve => {
    const image = new Image();
    const finish = (result: HTMLImageElement | null) => {
      image.onload = null; image.onerror = null; signal.removeEventListener('abort', abort); resolve(result);
    };
    const abort = () => { finish(null); image.src = ''; };
    image.onload = () => finish(image); image.onerror = () => finish(null);
    signal.addEventListener('abort', abort, { once: true });
    image.decoding = 'async'; image.src = `${import.meta.env.BASE_URL}assets/macbook-lid-mark.svg`;
  });
}

/** The returned renderer owns no clock. Studio lighting is prefiltered once,
 * and only a changed pose or viewport submits another frame to the GPU. */
export async function createThreeHardware(canvas: HTMLCanvasElement, keyboardTemplate: HTMLElement, signal: AbortSignal): Promise<ThreeHardwareRenderer | null> {
  const logo = await loadLogo(signal);
  if (!logo || signal.aborted) {
    if (!logo && !signal.aborted) console.error('Three.js MacBook lid artwork could not load');
    return null;
  }
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' }); }
  catch (error) { console.error('Three.js MacBook WebGL renderer unavailable', error); return null; }
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>();
  let environment: WebGLRenderTarget | undefined;
  let disposed = false;
  const dispose = () => {
    // A decode may finish after an abort; release any resources it just added.
    geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
    textures.forEach(value => { value.dispose(); (value.image as ImageBitmap | undefined)?.close?.(); });
    geometries.clear(); materials.clear(); textures.clear();
    if (disposed) return;
    disposed = true;
    signal.removeEventListener('abort', dispose); canvas.removeEventListener('webglcontextlost', contextLost);
    environment?.dispose(); renderer.dispose();
    canvas.width = 1; canvas.height = 1; canvas.style.removeProperty('opacity');
    for (const property of ['width', 'height', 'left', 'top', 'transform-origin']) canvas.style.removeProperty(property);
    delete canvas.dataset.renderer;
  };
  const contextLost = (event: Event) => { event.preventDefault(); dispose(); canvas.dataset.renderer = 'lost'; };
  signal.addEventListener('abort', dispose, { once: true });
  canvas.addEventListener('webglcontextlost', contextLost);

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}models/macbook-details.glb`, { signal });
    if (!response.ok) throw Error(`MacBook details returned ${response.status}`);
    const asset = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(await response.arrayBuffer(), '');
    asset.scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      geometries.add(object.geometry);
      for (const paint of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(paint);
        for (const value of Object.values(paint)) if ((value as Texture)?.isTexture) textures.add(value as Texture);
        if ('envMapIntensity' in paint) paint.envMapIntensity = .12;
      }
    });
    if (signal.aborted || disposed) { dispose(); return null; }
    const keys = keyboardLayout(keyboardTemplate);
    const scene = new Scene(), root = new Group(), lidPivot = new Group(), lid = new Group(), camera = new PerspectiveCamera();
    root.matrixAutoUpdate = false;
    lidPivot.position.set(450, D + macBookDimensions.hingeDrop, 0);
    lid.position.z = -macBookDimensions.lidRecess;
    const baseDetails = asset.scene.getObjectByName('Base_Details'), lidDetails = asset.scene.getObjectByName('Lid_Details');
    if (!baseDetails || !lidDetails) throw Error('MacBook details are incomplete');
    // Seat both hinge halves one model unit inside the rear silhouette. The
    // lid-side local +y points behind the body when the lid closes at 90°.
    const hingeInset = 1;
    baseDetails.position.z += Math.max(0, hingeInset - new Box3().setFromObject(baseDetails).min.z);
    lidDetails.position.y -= Math.max(0, new Box3().setFromObject(lidDetails).max.y + hingeInset);
    lidPivot.add(lid, lidDetails); root.add(lidPivot, baseDetails); scene.add(root);
    renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = false;

    const studio = new RoomEnvironment(), pmrem = new PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(studio, .045); scene.environment = environment.texture; }
    finally { studio.dispose(); pmrem.dispose(); }
    // Large neutral sources in the static environment produce soft reflections;
    // these restrained direct lights define the top surface and beveled edge.
    const keyLight = new DirectionalLight(0xffffff, 2.1); keyLight.position.set(-1200, 1800, 1800);
    const fillLight = new DirectionalLight(0xdce9ff, .65); fillLight.position.set(1800, 400, -1200);
    scene.add(keyLight, fillLight);
    const material = <T extends Material>(value: T): T => { materials.add(value); return value; };
    const silver = material(new MeshPhysicalMaterial({ color: 0xcbd0d5, metalness: 1, roughness: .28, envMapIntensity: 1.08, clearcoat: .10, clearcoatRoughness: .32 }));
    const hingeCover = lidDetails.getObjectByName('Lid_Clutch');
    const hingeEnds = baseDetails.getObjectByName('Clutch_Cover');
    if (hingeCover instanceof Mesh && hingeEnds instanceof Mesh) {
      const original = hingeCover.geometry;
      original.computeBoundingBox();
      hingeEnds.geometry.computeBoundingBox();
      const ends = hingeEnds.geometry.boundingBox!;
      hingeCover.geometry = extendHingeCover(original, ends.min.x - lidPivot.position.x, ends.max.x - lidPivot.position.x);
      geometries.add(hingeCover.geometry);
      geometries.delete(original); original.dispose();
      const darkCover = Array.isArray(hingeCover.material) ? hingeCover.material[0] : hingeCover.material;
      hingeCover.material = [darkCover, silver];
    }
    const edgeSilver = material(new MeshStandardMaterial({ color: 0xd4d9de, metalness: 1, roughness: .23, envMapIntensity: 1.12 }));
    const bottomSilver = material(new MeshStandardMaterial({ color: 0xb7bec5, metalness: 1, roughness: .36, envMapIntensity: .95 }));
    const trackpadSilver = material(new MeshStandardMaterial({ color: 0xc5cbd1, metalness: .92, roughness: .34, envMapIntensity: 1.02 }));
    const seam = material(new MeshStandardMaterial({ color: 0x747c84, metalness: .88, roughness: .36 }));
    const keycap = material(new MeshPhysicalMaterial({ color: 0x101318, metalness: 0, roughness: .68,
      envMapIntensity: .16, specularIntensity: .25, clearcoat: 0 }));
    const touchSensor = material(new MeshPhysicalMaterial({ color: 0x090a0c, metalness: 0, roughness: .62,
      envMapIntensity: .10, specularIntensity: .12, clearcoat: 0 }));
    const rubber = material(new MeshStandardMaterial({ color: 0x1c2025, metalness: 0, roughness: .78 }));
    const black = material(new MeshBasicMaterial({ color: 0x000000 }));
    const add = (parent: Group, shape: BufferGeometry, paint: Material) => {
      geometries.add(shape); const mesh = new Mesh(shape, paint); parent.add(mesh); return mesh;
    };
    // Project the footprint onto the surface beneath the feet. Cached softness
    // levels blend as the Mac descends and settles into contact with the surface.
    const ground = new Group(); scene.add(ground);
    const shadowPadding = 256;
    const shadowWidth = W + shadowPadding * 2, shadowDepth = D + shadowPadding * 2;
    const groundLayers = [12, 64, 192].map((blur, index) => {
      const mask = document.createElement('canvas'); mask.width = 1024; mask.height = 768;
      const brush = mask.getContext('2d')!;
      brush.fillStyle = '#000'; brush.shadowColor = 'rgb(32, 36, 42)'; brush.shadowBlur = blur;
      brush.shadowOffsetX = 2048;
      brush.beginPath();
      // Contact follows the inset underside, not the outer rim. Its narrow
      // falloff anchors the feet without adding a dark outline around the Mac.
      const inset = index === 0 ? 11 : 0;
      brush.roundRect((shadowPadding + inset) / shadowWidth * 1024 - 2048,
        (shadowPadding + inset) / shadowDepth * 768,
        (W - inset * 2) / shadowWidth * 1024, (D - inset * 2) / shadowDepth * 768,
        index === 0 ? 12 : 48);
      brush.fill();
      const texture = new CanvasTexture(mask);
      texture.flipY = false; texture.colorSpace = SRGBColorSpace; textures.add(texture);
      const paint = material(new MeshBasicMaterial({ map: texture, transparent: true,
        depthWrite: false, toneMapped: false, side: DoubleSide, opacity: 0 }));
      const mesh = add(ground, face(shadowWidth, shadowDepth, 16, 20,
        (x, y, z) => deckPoint(x - shadowPadding, y - shadowPadding, z), true), paint);
      mesh.matrixAutoUpdate = false;
      return { mesh, paint };
    });
    const nativeModel = new Matrix4(), groundProjection = new Matrix4(), groundModel = new Matrix4();
    const shadowSpread = new Matrix4(), shadowScale = new Matrix4();
    const shadowCenter = new Matrix4().makeTranslation(450, D + 23, D / 2);
    const shadowUncenter = new Matrix4().makeTranslation(-450, -D - 23, -D / 2);
    const enclosure = createMacBookEnclosure();
    add(root, enclosure.deck, silver); add(root, enclosure.scoop, silver);
    add(root, enclosure.keyboardFloor, silver); add(root, enclosure.keyboardWall, silver);
    add(root, enclosure.base, edgeSilver); add(root, enclosure.underside, bottomSilver);
    add(lid, enclosure.rim, edgeSilver); add(lid, enclosure.front, black);
    add(lid, enclosure.back, silver); add(lid, enclosure.lid, edgeSilver);
    const merge = (parts: BufferGeometry[]) => {
      // Side walls carry no UVs; the materials used here need only positions and
      // normals. Removing the face UVs allows one draw for the original keycaps/feet.
      parts.forEach(part => part.deleteAttribute('uv'));
      const merged = mergeGeometries(parts, false);
      parts.forEach(part => part.dispose());
      if (!merged) throw Error('MacBook detail geometry could not be merged');
      return merged;
    };
    const keyboardGroup = new Group(); keyboardGroup.position.y = keyboardPlacement.recess; root.add(keyboardGroup);
    const keyFaces: BufferGeometry[] = [], keyEdges: BufferGeometry[] = [];
    for (const key of keys) {
      const map: Mapper = (x, y, z) => deckPoint(key.x + x, key.y + y, z);
      const radius = key.arrow ? 3 : 5;
      if (key.touchID) {
        const touch = createMacBookTouchID(key);
        keyFaces.push(touch.top, touch.wall);
        add(keyboardGroup, touch.sensor, touchSensor);
      } else {
        keyFaces.push(face(key.width, key.height, radius, -2.6, map, true, .55));
      }
      keyFaces.push(shell(key.width, key.height, radius, [{ z: -.12, inset: 0 }, { z: -2.0, inset: .12 }, { z: -2.6, inset: .55 }], map));
      (key.touchID ? keyFaces : keyEdges).push(face(key.width + 2.5, key.height + 2.5, radius + 1.25, -.05,
        (x, y, z) => deckPoint(key.x - 1.25 + x, key.y - 1.25 + y, z), true));
    }
    add(keyboardGroup, merge(keyFaces), keycap); add(keyboardGroup, merge(keyEdges), seam);
    const atlas = createKeyboardLegendAtlas(keys);
    const legendTexture = new CanvasTexture(atlas.canvas);
    legendTexture.flipY = false; legendTexture.colorSpace = SRGBColorSpace;
    legendTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.add(legendTexture);
    const legendMaterial = material(new MeshBasicMaterial({ map: legendTexture, transparent: true,
      depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    const legendFaces = keys.map((key, index) => {
      const shape = face(key.width, key.height, key.arrow ? 3 : 5, -2.68,
        (x, y, z) => deckPoint(key.x + x, key.y + y, z), true, 1);
      const uv = shape.getAttribute('uv'), region = atlas.regions[index];
      for (let vertex = 0; vertex < uv.count; vertex++) {
        // The keyboard's top edge points toward the hinge (native y grows away
        // from the palm rest), so atlas rows run opposite its local face y.
        uv.setXY(vertex, region.left + uv.getX(vertex) * region.width, region.top + (1 - uv.getY(vertex)) * region.height);
      }
      return shape;
    });
    const legends = mergeGeometries(legendFaces, false)!;
    legendFaces.forEach(part => part.dispose()); add(keyboardGroup, legends, legendMaterial);
    // Measure both clearances edge-to-edge: keyboard well to trackpad, then
    // trackpad to the deepest part of the scoop. Grow the former by exactly 50%.
    const keyboardFront = D - keyboardPlacement.rear - keyboardPlacement.depth - keyboardPlacement.padding;
    const trackpadGap = (keyboardFront - (31 + 191)) * 1.5;
    const trackpadFront = fingerRecess.depth + trackpadGap;
    const trackpadDepth = keyboardFront - trackpadGap - trackpadFront;
    const trackpad: Mapper = (x, y, z) => deckPoint(W / 2 - 176 + x, trackpadFront + y, z);
    add(root, face(352, trackpadDepth, 11, -.04, trackpad, true), seam);
    add(root, face(352, trackpadDepth, 11, -.10, trackpad, true, .75), trackpadSilver);
    const feet: BufferGeometry[] = [];
    for (const x of [44, W - 86]) for (const y of [12, D - 50]) {
      const map: Mapper = (px, py, z) => deckPoint(x + px, y + py, z);
      feet.push(shell(42, 26, 10, [{ z: 17, inset: 0 }, { z: 20, inset: 1 }], map));
      feet.push(face(42, 26, 10, 20, map, false, 1));
    }
    add(root, merge(feet), rubber);

    const mask = document.createElement('canvas'); mask.width = 1560; mask.height = 1800;
    const brush = mask.getContext('2d');
    if (!brush) throw Error('MacBook lid mark unavailable');
    brush.drawImage(logo, 0, 0, mask.width, mask.height); brush.globalCompositeOperation = 'source-in';
    brush.fillStyle = '#fff'; brush.fillRect(0, 0, mask.width, mask.height);
    const logoTexture = new CanvasTexture(mask); logoTexture.flipY = false; textures.add(logoTexture);
    const logoMetal = material(new MeshStandardMaterial({ color: 0x808a94, metalness: 1, roughness: .20,
      envMapIntensity: 1.1, alphaMap: logoTexture, alphaTest: .15 }));
    // Orient the mark for the outside of the lid: its crown points toward the
    // front edge when closed, so it reads upright to someone facing an open Mac.
    const lidMark = face(78, 90, .01, -6.07,
      (x, y, z) => lidPoint(W / 2 - 39 + x, D / 2 - 45 + y, z), true, 0, true);
    add(lid, lidMark, logoMetal);

    const cssToThree = new Matrix4().makeScale(1, -1, 1);
    // Render beyond the stage so the soft shadow never ends at its rectangle.
    // Keeping the transform origin at the stage origin preserves HTML alignment.
    const canvasPadding = 256;
    canvas.style.left = canvas.style.top = `${-canvasPadding}px`;
    canvas.style.transformOrigin = `${canvasPadding}px ${canvasPadding}px`;
    const previousMatrix = new Float32Array(16), nextMatrix = new Float32Array(16);
    let width = 1, height = 1, perspective = 2400, dirty = true, lastFold = NaN, lastOpacity = NaN, lastElevation = NaN, lastShadowOpacity = NaN;
    configureThreeCamera(camera, width, height, perspective, canvasPadding);
    // Compile PBR programs once while the caller is warming the hidden canvas.
    renderer.compile(scene, camera);
    const gl = renderer.getContext();
    const viewportLimit = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    const bufferLimit = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
    if (signal.aborted || renderer.getContext().isContextLost()) { dispose(); return null; }
    canvas.dataset.renderer = 'three-original-pro-details';
    return {
      resize(nextWidth, nextHeight, dpr) {
        if (disposed || ![nextWidth, nextHeight, dpr].every(Number.isFinite) || nextWidth <= 0 || nextHeight <= 0) return;
        const renderWidth = nextWidth + canvasPadding * 2, renderHeight = nextHeight + canvasPadding * 2;
        const ratio = Math.min(2, Math.max(.5, dpr), Math.min(viewportLimit[0], bufferLimit) / renderWidth, Math.min(viewportLimit[1], bufferLimit) / renderHeight);
        const physicalWidth = Math.max(1, Math.floor(renderWidth * ratio)), physicalHeight = Math.max(1, Math.floor(renderHeight * ratio));
        if (width !== nextWidth || height !== nextHeight) {
          width = nextWidth; height = nextHeight;
          canvas.style.width = `${renderWidth}px`; canvas.style.height = `${renderHeight}px`;
          configureThreeCamera(camera, width, height, perspective, canvasPadding); dirty = true;
        }
        if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
          renderer.setDrawingBufferSize(renderWidth, renderHeight, ratio); dirty = true;
        }
      },
      render(pose) {
        if (disposed || pose.modelMatrix.length !== 16 || !Number.isFinite(pose.fold)
          || !Number.isFinite(pose.perspective) || pose.perspective <= 0) return false;
        const opacity = Math.max(0, Math.min(1, Number.isFinite(pose.opacity) ? pose.opacity! : 1));
        // Composite the entire opaque model as one layer instead of making each
        // metal surface transparent and breaking the enclosure's depth ordering.
        if (opacity !== lastOpacity) { canvas.style.opacity = String(opacity); lastOpacity = opacity; }
        if (opacity === 0) return true;
        let changed = dirty;
        for (let index = 0; index < 16; index++) {
          if (!Number.isFinite(pose.modelMatrix[index])) return false;
          nextMatrix[index] = pose.modelMatrix[index];
          if (nextMatrix[index] !== previousMatrix[index]) changed = true;
        }
        const fold = Math.max(0, Math.min(90, pose.fold));
        if (fold !== lastFold) changed = true;
        const elevation = Math.max(0, Number.isFinite(pose.elevation) ? pose.elevation! : 0);
        if (elevation !== lastElevation) changed = true;
        const shadowOpacity = Math.max(0, Math.min(1, pose.shadowOpacity ?? 1));
        if (shadowOpacity !== lastShadowOpacity) changed = true;
        if (pose.perspective !== perspective) {
          perspective = pose.perspective; configureThreeCamera(camera, width, height, perspective, canvasPadding); changed = true;
        }
        if (!changed) return true;
        nativeModel.fromArray(nextMatrix);
        root.matrix.copy(nativeModel).premultiply(cssToThree); root.matrixWorldNeedsUpdate = true;
        lidPivot.rotation.x = -fold * Math.PI / 180;
        const airborne = Math.min(1, elevation / 208);
        const floorY = D + 23 + elevation;
        // The surface shares the scene's viewing angle and meets all four feet
        // at rest. Height offsets the shadow and softens it during the descent.
        groundProjection.set(1, -.18, 0, .18 * floorY,
          0, 0, 0, floorY, 0, .12, 1, -.12 * floorY, 0, 0, 0, 1);
        groundModel.copy(nativeModel).multiply(groundProjection);
        const spread = 1 + .24 * airborne;
        shadowSpread.copy(shadowCenter).multiply(shadowScale.makeScale(spread, 1, spread)).multiply(shadowUncenter);
        groundLayers.forEach(({ mesh, paint }, index) => {
          mesh.matrix.copy(cssToThree).multiply(groundModel).multiply(shadowSpread);
          mesh.matrixWorldNeedsUpdate = true;
          paint.opacity = shadowOpacity * (index === 0 ? .18 * Math.exp(-elevation / 8)
            : index === 1 ? .10 * (1 - airborne) ** 2 : .08 + .035 * airborne);
        });
        renderer.render(scene, camera);
        previousMatrix.set(nextMatrix);
        lastFold = fold; lastElevation = elevation; lastShadowOpacity = shadowOpacity; dirty = false;
        return true;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    if (!signal.aborted) console.error('Three.js MacBook initialization failed', error);
    return null;
  }
}
