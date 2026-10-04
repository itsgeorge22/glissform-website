import { macBookGeometry } from '../MacBookShell';

const W = 900;
const D = macBookGeometry.depth;
const L = (W - macBookGeometry.width) / 2;
const A = 4096;
const ATLAS_HEIGHT = 2304;

type Point = [number, number, number];
export type MacBookHardwarePose = {
  /** Physical closure from the upright lid, in degrees. */
  fold: number;
  /** Column-major CSS matrix from rig-local coordinates into stage CSS pixels.
   * Include the [450,D,0] transform origin; omit the stage perspective. */
  modelMatrix: ArrayLike<number>;
  /** CSS perspective distance, centered on the stage viewport. */
  perspective: number;
  opacity?: number;
};
export type MacBookHardwareRenderer = {
  resize(width: number, height: number, dpr: number): void;
  /** False means the renderer was disposed or the supplied pose is invalid. */
  render(pose: MacBookHardwarePose): boolean;
  dispose(): void;
};

const vertexSource = `#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
in vec3 color;
in vec2 flags;
uniform mat4 model;
uniform vec2 viewport;
uniform float perspective;
uniform float fold;
out vec2 texUV;
out vec3 tint;
flat out float kind;
void main() {
  vec3 p = position;
  if (flags.x > .5) {
    float angle = -radians(fold), c = cos(angle), s = sin(angle);
    p.y -= ${D};
    p.yz = mat2(c, s, -s, c) * p.yz;
    p.y += ${D};
  }
  vec4 world = model * vec4(p, 1.0);
  float w = world.w - world.z / perspective;
  // CSS y points downward, z toward the viewer. Perspective is applied around
  // the viewport center exactly as by the parent CSS perspective property.
  vec2 center = viewport * .5;
  gl_Position = vec4((world.x - center.x * world.w) * 2.0 / viewport.x,
    (center.y * world.w - world.y) * 2.0 / viewport.y,
    (8.05 / 7.95) * w - (.8 / 7.95) * world.w, w);
  texUV = uv; tint = color; kind = flags.y;
}`;
const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D atlas;
uniform float opacity;
in vec2 texUV;
in vec3 tint;
flat in float kind;
out vec4 outputColor;
void main() {
  vec4 paint = kind > .5 ? vec4(tint, 1.0) : texture(atlas, texUV);
  if (paint.a < .005) discard;
  outputColor = vec4(paint.rgb, paint.a * opacity);
}`;

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function gradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  stops: [number, string][],
) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad),
    dy = -Math.cos(rad);
  const length = Math.abs(w * dx) + Math.abs(h * dy);
  const g = ctx.createLinearGradient(
    x + w / 2 - (dx * length) / 2,
    y + h / 2 - (dy * length) / 2,
    x + w / 2 + (dx * length) / 2,
    y + h / 2 + (dy * length) / 2,
  );
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}
function plate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
  fill: string | CanvasGradient,
  stroke?: string,
  border = 1,
) {
  rounded(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    const inset = border / 2;
    const radii = Array.isArray(r)
      ? r.map((value) => Math.max(0, value - inset))
      : Math.max(0, r - inset);
    rounded(ctx, x + inset, y + inset, w - border, h - border, radii);
    ctx.lineWidth = border;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// CSS radial-gradient(ellipse farthest-corner ...) in the static metal artwork.
function metalHighlight(
  c: CanvasRenderingContext2D,
  width: number,
  x: number,
  y: number,
  stop: number,
  color: string,
) {
  c.save();
  rounded(c, L, 0, width, D, 22);
  c.clip();
  c.translate(L + width * x, D * y);
  c.scale(
    Math.max(x, 1 - x) * width * Math.SQRT2,
    Math.max(y, 1 - y) * D * Math.SQRT2,
  );
  const shine = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  shine.addColorStop(0, color);
  shine.addColorStop(stop, "#ffffff00");
  c.fillStyle = shine;
  c.fillRect(-2, -2, 4, 4);
  c.restore();
}

// Bake only static surface artwork. Positions come from the existing key layout;
// all movement and depth ordering are handled by the single WebGL scene.
function makeAtlas(
  device: HTMLElement,
  logo: HTMLImageElement,
) {
  const canvas = document.createElement("canvas");
  canvas.width = A;
  canvas.height = ATLAS_HEIGHT;
  const c = canvas.getContext("2d")!;
  const begin = (x: number, y: number) => {
    c.save();
    c.translate(x, y);
    c.scale(2, 2);
  };
  const width = macBookGeometry.width;
  // The live DOM owns the entire inner face, including its frame and notch.
  // This opaque backing prevents the deck showing through during screen frost.
  begin(0, 0);
  c.fillStyle = "#08090b";
  c.fillRect(0, 0, 1024, 576);
  c.restore();
  // Outside of the lid. The mesh mirrors U just like the CSS rotateY(180deg).
  begin(2048, 0);
  // Opaque paint extends beyond the mesh so filtering cannot soften its silhouette.
  const lidPaint = gradient(c, L, 0, width, D, 120, [
    [0, "#c4c7ca"],
    [0.35, "#e0e2e4"],
    [0.72, "#cbced1"],
    [1, "#b5b9bd"],
  ]);
  c.fillStyle = lidPaint;
  c.fillRect(0, 0, 1024, 576);
  plate(
    c,
    L,
    0,
    width,
    D,
    22,
    lidPaint,
    "#b1b5b9",
  );
  metalHighlight(c, width, 0.25, 0.12, 0.65, "#ffffff45");
  const mark = document.createElement("canvas");
  mark.width = 156;
  mark.height = 180;
  const m = mark.getContext("2d")!;
  m.drawImage(logo, 0, 0, 156, 180);
  m.globalCompositeOperation = "source-in";
  m.fillStyle = gradient(m, 0, 0, 156, 180, 120, [
    [0, "#80858b"],
    [0.38, "#ecedef"],
    [0.5, "#f7f8f9"],
    [0.68, "#a6abb0"],
    [1, "#797f86"],
  ]);
  m.fillRect(0, 0, 156, 180);
  c.drawImage(mark, 411, D / 2 - 45, 78, 90);
  c.restore();
  // Deck, including the original rounded keycaps, Touch ID and trackpad.
  begin(0, 1152);
  // Opaque paint extends beyond the mesh so filtering cannot soften its silhouette.
  const deckPaint = gradient(c, L, 0, width, D, 100, [
    [0, "#b7bcc1"],
    [0.17, "#d1d4d7"],
    [0.5, "#e0e2e4"],
    [0.83, "#c9cdd1"],
    [1, "#aeb4ba"],
  ]);
  c.fillStyle = deckPaint;
  c.fillRect(0, 0, 1024, 576);
  plate(
    c,
    L,
    0,
    width,
    D,
    22,
    deckPaint,
    "#a8aeb4",
  );
  metalHighlight(c, width, 0.45, 0.15, 0.6, "#ffffff38");
  plate(
    c,
    L + width / 2 - 176,
    31,
    352,
    191,
    11,
    gradient(c, L + width / 2 - 176, 31, 352, 191, 110, [
      [0, "#ced1d4"],
      [0.55, "#d8dadd"],
      [1, "#c7cbcf"],
    ]),
    "#a1a6ac",
  );
  plate(
    c,
    L + 58,
    D - 17,
    width - 116,
    12,
    6,
    gradient(c, 0, D - 17, 1, 12, 180, [
      [0, "#181a1c"],
      [0.4, "#34373b"],
      [0.75, "#111214"],
      [1, "#575c60"],
    ]),
  );
  const keyboard = device.querySelector<HTMLElement>(".seamless-macbook__keyboard");
  if (!keyboard || !keyboard.offsetWidth || !keyboard.offsetHeight) throw Error("MacBook keyboard template must have layout");
  for (const key of keyboard.querySelectorAll<HTMLElement>(
    ".seamless-macbook__key",
  )) {
    let x = 0,
      y = 0;
    let node: HTMLElement | null = key;
    while (node && node !== keyboard) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    const style = getComputedStyle(key),
      w = parseFloat(style.width),
      h = parseFloat(style.height);
    x += L + 86;
    y = D - 38 - y - h;
    c.save();
    c.shadowColor = "#ffffff75";
    c.shadowBlur = 1;
    c.shadowOffsetY = -1.5;
    plate(c, x - 1.25, y - 1.25, w + 2.5, h + 2.5, 6.25, "#777c80");
    c.restore();
    plate(
      c,
      x,
      y,
      w,
      h,
      key.classList.contains("seamless-macbook__key--arrow") ? 3 : 5,
      gradient(c, x, y, w, h, 35, [
        [0, "#303236"],
        [0.55, "#24262a"],
        [1, "#1d1f22"],
      ]),
      "#151719",
    );
    if (key.classList.contains("seamless-macbook__key--touch-id"))
      plate(
        c,
        x + w / 2 - 11,
        y + h / 2 - 11,
        22,
        22,
        11,
        gradient(c, x, y, w, h, 45, [
          [0, "#17191c"],
          [1, "#33363b"],
        ]),
        "#60636a",
      );
  }
  c.restore();
  // Front opening and feet occupy their original planes, not the deck texture.
  begin(2048, 1152);
  plate(
    c,
    400,
    0,
    100,
    6,
    [0, 0, 10, 10],
    gradient(c, 400, 0, 100, 6, 180, [
      [0, "#74787d"],
      [0.7, "#aeb2b6"],
      [1, "#d7dadd"],
    ]),
  );
  for (const x of [L + 44, L + width - 86])
    plate(c, x, 18, 42, 3, [0, 0, 4, 4], "#4a4d52");
  c.restore();
  return canvas;
}

function loadLogo(signal: AbortSignal): Promise<HTMLImageElement | null> {
  if (signal.aborted) return Promise.resolve(null);
  return new Promise(resolve => {
    const image = new Image();
    const finish = (value: HTMLImageElement | null) => {
      signal.removeEventListener('abort', abort);
      image.onload = null; image.onerror = null;
      resolve(value);
    };
    const abort = () => { finish(null); image.src = ''; };
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.decoding = 'async';
    signal.addEventListener('abort', abort, { once: true });
    image.src = '/assets/macbook-lid-mark.svg';
  });
}

/** Hardware only. The caller controls scheduling and overlays the same live DOM
 * hero; initialization can be deferred until the first pullback. The template
 * must retain keyboard layout until this promise resolves, then may unmount. */
export async function createMacBookHardware(
  canvas: HTMLCanvasElement,
  deviceForStaticKeyboardArtwork: HTMLElement,
  signal: AbortSignal,
): Promise<MacBookHardwareRenderer | null> {
  const logo = await loadLogo(signal);
  if (!logo || signal.aborted) return null;
  let gl: WebGL2RenderingContext | null;
  try {
    gl = canvas.getContext('webgl2', {
      alpha: true, antialias: true, depth: true,
      premultipliedAlpha: true, powerPreference: 'low-power',
    });
  } catch { return null; }
  if (!gl || gl.isContextLost()) return null;
  const context = gl;
  const shaders: WebGLShader[] = [], programs: WebGLProgram[] = [];
  const buffers: WebGLBuffer[] = [], textures: WebGLTexture[] = [], vaos: WebGLVertexArrayObject[] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', contextLost);
    signal.removeEventListener('abort', dispose);
    shaders.forEach(value => context.deleteShader(value));
    programs.forEach(value => context.deleteProgram(value));
    buffers.forEach(value => context.deleteBuffer(value));
    textures.forEach(value => context.deleteTexture(value));
    vaos.forEach(value => context.deleteVertexArray(value));
    canvas.width = 1; canvas.height = 1;
    delete canvas.dataset.renderer;
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    dispose();
    canvas.dataset.renderer = 'lost';
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  signal.addEventListener('abort', dispose, { once: true });

  try {
    const program = context.createProgram();
    if (!program) throw Error('Hardware program unavailable');
    programs.push(program);
    for (const [type, source] of [[context.VERTEX_SHADER, vertexSource], [context.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = context.createShader(type);
      if (!shader) throw Error('Hardware shader unavailable');
      shaders.push(shader);
      context.shaderSource(shader, source); context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw Error(context.getShaderInfoLog(shader) || 'Hardware shader compilation failed');
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) throw Error(context.getProgramInfoLog(program) || 'Hardware shader linking failed');

    const atlas = makeAtlas(deviceForStaticKeyboardArtwork, logo);
    const texture = context.createTexture();
    if (!texture) throw Error('Hardware material texture unavailable');
    textures.push(texture);
    context.bindTexture(context.TEXTURE_2D, texture);
    const maxTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE) as number;
    let artwork = atlas;
    if (maxTextureSize < A) {
      artwork = document.createElement('canvas');
      const ratio = maxTextureSize / A;
      artwork.width = maxTextureSize; artwork.height = Math.max(1, Math.floor(ATLAS_HEIGHT * ratio));
      artwork.getContext('2d')!.drawImage(atlas, 0, 0, artwork.width, artwork.height);
    }
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, artwork);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    const anisotropy = context.getExtension('EXT_texture_filter_anisotropic');
    if (anisotropy) context.texParameterf(context.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, context.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    context.generateMipmap(context.TEXTURE_2D);
    // The atlas is immutable; retain its GPU texture without its large CPU copy.
    atlas.width = 1; atlas.height = 1;
    if (artwork !== atlas) { artwork.width = 1; artwork.height = 1; }

    const vertices: number[] = [];
    const triangle = (points: Point[], uv: number[][], part: number, kind = 0, colors = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]) => {
      points.forEach((point, index) => vertices.push(...point, ...uv[index], ...colors[index], part, kind));
    };
    const quad = (points: Point[], uvRect: number[]) => {
      const uv = [
        [(2048 + uvRect[0] * 2) / A, (1152 + uvRect[1] * 2) / ATLAS_HEIGHT],
        [(2048 + (uvRect[0] + uvRect[2]) * 2) / A, (1152 + uvRect[1] * 2) / ATLAS_HEIGHT],
        [(2048 + (uvRect[0] + uvRect[2]) * 2) / A, (1152 + (uvRect[1] + uvRect[3]) * 2) / ATLAS_HEIGHT],
        [(2048 + uvRect[0] * 2) / A, (1152 + (uvRect[1] + uvRect[3]) * 2) / ATLAS_HEIGHT],
      ];
      for (const indices of [[0, 1, 2], [0, 2, 3]]) triangle(indices.map(index => points[index]), indices.map(index => uv[index]), 0);
    };
    const deckPoint = (x: number, y: number, z: number): Point => [L + x, D + 3 + z, D - y];
    const perimeter = (inset: number) => [
      [22, 22, Math.PI], [macBookGeometry.width - 22, 22, Math.PI * 1.5],
      [macBookGeometry.width - 22, D - 22, 0], [22, D - 22, Math.PI * .5],
    ].flatMap(([x, y, start]) => Array.from({ length: 9 }, (_, index) => [
      x + (22 - inset) * Math.cos(start + index * Math.PI / 16),
      y + (22 - inset) * Math.sin(start + index * Math.PI / 16),
    ]));
    const surface = (tile: number, part: number, z: number, reverse = false, flip = false, inset = 0, tint?: number[]) => {
      const edge = perimeter(inset), center = [macBookGeometry.width / 2, D / 2];
      const point = (p: number[]): Point => part ? [L + p[0], p[1], z] : deckPoint(p[0], p[1], z);
      const uv = (p: number[]) => [
        ((tile % 2) * 2048 + (flip ? 900 - L - p[0] : L + p[0]) * 2) / A,
        (Math.floor(tile / 2) * 1152 + p[1] * 2) / ATLAS_HEIGHT,
      ];
      for (let index = 0; index < edge.length; index++) {
        const points = [center, edge[index], edge[(index + 1) % edge.length]];
        if (reverse) points.reverse();
        triangle(points.map(point), points.map(uv), part, tint ? 1 : 0, tint ? [tint, tint, tint] : undefined);
      }
    };
    // Deck coordinates are viewed from their reverse side after rotateX(-90).
    // Opposite lid faces have opposite windings, so true camera-space facing
    // remains correct through every yaw, roll and fold supplied by the caller.
    surface(2, 0, 0, true);
    surface(1, 1, -6, true, true);
    surface(0, 1, 0);
    surface(0, 0, 17, false, false, 11, [.65, .67, .69]);
    quad([[400, D + 2, D + .1], [500, D + 2, D + .1], [500, D + 8, D + .1], [400, D + 8, D + .1]], [400, 0, 100, 6]);
    for (const x of [L + 44, L + macBookGeometry.width - 86]) {
      quad([[x, D + 21, D - 12], [x + 42, D + 21, D - 12], [x + 42, D + 24, D - 12], [x, D + 24, D - 12]], [x, 18, 42, 3]);
    }
    const shell = (part: number, rings: { z: number; inset: number; color: number[] }[]) => {
      const point = (p: number[], z: number): Point => part ? [L + p[0], p[1], z] : deckPoint(p[0], p[1], z);
      for (let band = 0; band < rings.length - 1; band++) {
        const a = rings[band], b = rings[band + 1], upper = perimeter(a.inset), lower = perimeter(b.inset);
        for (let index = 0; index < upper.length; index++) {
          const next = (index + 1) % upper.length;
          const points = [point(upper[index], a.z), point(upper[next], a.z), point(lower[next], b.z), point(lower[index], b.z)];
          const colors = [a.color, a.color, b.color, b.color];
          for (const indices of [[0, 1, 2], [0, 2, 3]]) triangle(indices.map(i => points[i]), indices.map(() => [0, 0]), part, 1, indices.map(i => colors[i]));
        }
      }
    };
    shell(1, [
      { z: -6, inset: 0, color: [185, 190, 195] }, { z: -4.68, inset: 0, color: [209, 212, 215] },
      { z: -1.8, inset: 0, color: [174, 179, 184] }, { z: 0, inset: 0, color: [144, 150, 156] },
    ].map(ring => ({ ...ring, color: ring.color.map(value => value / 255) })));
    const metal = (shade: number) => [shade - 3, shade, shade + 3].map(value => value / 255);
    shell(0, [{ z: 0, inset: 0, color: metal(205) }, ...Array.from({ length: 7 }, (_, index) => {
      const angle = index * Math.PI / 12;
      return { z: 6 + 11 * Math.sin(angle), inset: 11 * (1 - Math.cos(angle)), color: metal(Math.round(205 - 65 * Math.sin(angle))) };
    })]);

    const vao = context.createVertexArray(), buffer = context.createBuffer();
    if (!vao || !buffer) {
      if (vao) context.deleteVertexArray(vao);
      if (buffer) context.deleteBuffer(buffer);
      throw Error('Hardware geometry unavailable');
    }
    vaos.push(vao); buffers.push(buffer);
    context.bindVertexArray(vao); context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertices), context.STATIC_DRAW);
    let offset = 0;
    for (const [name, size] of [['position', 3], ['uv', 2], ['color', 3], ['flags', 2]] as const) {
      const location = context.getAttribLocation(program, name);
      context.enableVertexAttribArray(location);
      context.vertexAttribPointer(location, size, context.FLOAT, false, 40, offset * 4);
      offset += size;
    }
    const locations = {
      model: context.getUniformLocation(program, 'model'), viewport: context.getUniformLocation(program, 'viewport'),
      perspective: context.getUniformLocation(program, 'perspective'), fold: context.getUniformLocation(program, 'fold'),
      opacity: context.getUniformLocation(program, 'opacity'), atlas: context.getUniformLocation(program, 'atlas'),
    };
    const viewportLimit = context.getParameter(context.MAX_VIEWPORT_DIMS) as Int32Array;
    const matrix = new Float32Array(16), lastMatrix = new Float32Array(16);
    let width = 1, height = 1, dirty = true;
    let lastFold = NaN, lastPerspective = NaN, lastOpacity = NaN;
    if (signal.aborted || context.isContextLost()) { dispose(); return null; }
    canvas.dataset.renderer = 'hardware-webgl';
    return {
      resize(nextWidth, nextHeight, dpr) {
        if (disposed || ![nextWidth, nextHeight, dpr].every(Number.isFinite) || nextWidth <= 0 || nextHeight <= 0) return;
        if (width !== nextWidth || height !== nextHeight) dirty = true;
        width = nextWidth; height = nextHeight;
        const ratio = Math.min(2, Math.max(.5, dpr), viewportLimit[0] / width, viewportLimit[1] / height);
        const w = Math.max(1, Math.round(width * ratio)), h = Math.max(1, Math.round(height * ratio));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = true; }
      },
      render(pose) {
        if (disposed || pose.modelMatrix.length !== 16 || !Number.isFinite(pose.fold)
          || !Number.isFinite(pose.perspective) || pose.perspective <= 0) return false;
        let sameMatrix = true;
        for (let index = 0; index < 16; index++) {
          if (!Number.isFinite(pose.modelMatrix[index])) return false;
          matrix[index] = pose.modelMatrix[index];
          if (matrix[index] !== lastMatrix[index]) sameMatrix = false;
        }
        const fold = Math.max(0, Math.min(90, pose.fold));
        const opacity = Math.max(0, Math.min(1, Number.isFinite(pose.opacity) ? pose.opacity! : 1));
        if (!dirty && sameMatrix && fold === lastFold && pose.perspective === lastPerspective && opacity === lastOpacity) return true;
        dirty = false; lastMatrix.set(matrix); lastFold = fold; lastPerspective = pose.perspective; lastOpacity = opacity;
        context.viewport(0, 0, canvas.width, canvas.height);
        context.clearColor(0, 0, 0, 0); context.clearDepth(1);
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        if (opacity === 0) return true;
        context.useProgram(program); context.bindVertexArray(vao);
        context.activeTexture(context.TEXTURE0); context.bindTexture(context.TEXTURE_2D, texture);
        context.uniform1i(locations.atlas, 0);
        context.uniformMatrix4fv(locations.model, false, matrix);
        context.uniform2f(locations.viewport, width, height);
        context.uniform1f(locations.perspective, pose.perspective);
        context.uniform1f(locations.fold, fold); context.uniform1f(locations.opacity, opacity);
        context.enable(context.DEPTH_TEST); context.depthFunc(context.LEQUAL);
        context.enable(context.CULL_FACE); context.cullFace(context.BACK); context.frontFace(context.CW);
        context.enable(context.BLEND);
        context.blendFuncSeparate(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA, context.ONE, context.ONE_MINUS_SRC_ALPHA);
        context.drawArrays(context.TRIANGLES, 0, vertices.length / 10);
        return true;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    if (!signal.aborted) console.error('MacBook hardware initialization failed', error);
    return null;
  }
}
