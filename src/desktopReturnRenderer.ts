import { desktopFragmentSource } from './seamlessWallpaper';
import { desktopProjection, desktopShading } from './desktopProjection';

const vertexSource = `#version 300 es
in vec2 position;
out vec2 screenUV;
void main() {
  // Image uploads use their original top-left orientation, as in the hero.
  screenUV = vec2((position.x + 1.0) * .5, (1.0 - position.y) * .5);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export type DesktopReturnRenderer = {
  render(foldDegrees: number): void;
  dispose(): void;
};

/** Reproject one wallpaper inside the fixed screen; the parent owns its pose. */
export function createDesktopReturnRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement): DesktopReturnRenderer | null {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return null;
  let gl: WebGL2RenderingContext | null;
  try {
    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      // The preview holds still between interactions, without a perpetual loop.
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
  } catch {
    canvas.dataset.renderer = 'failed';
    return null;
  }
  if (!gl) { canvas.dataset.renderer = 'failed'; return null; }
  const context = gl;
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let vertexArray: WebGLVertexArrayObject | null = null;
  let texture: WebGLTexture | null = null;
  let disposed = false;
  let previousDegrees = -1;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', lost);
    shaders.forEach(shader => context.deleteShader(shader));
    context.deleteProgram(program);
    context.deleteBuffer(buffer);
    context.deleteVertexArray(vertexArray);
    context.deleteTexture(texture);
    canvas.width = 1;
    canvas.height = 1;
    delete canvas.dataset.renderer;
  };
  const fail = () => { dispose(); canvas.dataset.renderer = 'failed'; };
  const lost = () => { fail(); };
  canvas.addEventListener('webglcontextlost', lost);

  try {
    if (Math.max(image.naturalWidth, image.naturalHeight) > context.getParameter(context.MAX_TEXTURE_SIZE)) {
      throw new Error('Wallpaper exceeds the graphics texture limit');
    }
    program = context.createProgram();
    if (!program) throw new Error('Unable to allocate wallpaper program');
    for (const [type, source] of [[context.VERTEX_SHADER, vertexSource], [context.FRAGMENT_SHADER, desktopFragmentSource]] as const) {
      const shader = context.createShader(type);
      if (!shader) throw new Error('Unable to allocate wallpaper shader');
      shaders.push(shader);
      context.shaderSource(shader, source);
      context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error('Unable to compile wallpaper shader');
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error('Unable to link wallpaper program');
    vertexArray = context.createVertexArray();
    buffer = context.createBuffer();
    texture = context.createTexture();
    if (!vertexArray || !buffer || !texture) throw new Error('Unable to allocate wallpaper resources');
    context.bindVertexArray(vertexArray);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), context.STATIC_DRAW);
    const position = context.getAttribLocation(program, 'position');
    context.enableVertexAttribArray(position);
    context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, false);
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.generateMipmap(context.TEXTURE_2D);
    context.useProgram(program);
    context.uniform1i(context.getUniformLocation(program, 'desktop'), 0);
    context.uniform2f(context.getUniformLocation(program, 'imageSize'), image.naturalWidth, image.naturalHeight);
    const fold = context.getUniformLocation(program, 'fold');
    const projection = context.getUniformLocation(program, 'projection');
    const shading = context.getUniformLocation(program, 'shading');
    const viewportLimit = context.getParameter(context.MAX_VIEWPORT_DIMS) as Int32Array;
    context.disable(context.DEPTH_TEST);
    context.disable(context.BLEND);

    const render = (foldDegrees: number) => {
      if (disposed) return;
      if (context.isContextLost()) { fail(); return; }
      try {
        const ratio = Math.min(canvas.ownerDocument.defaultView?.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.min(viewportLimit[0], Math.round(canvas.clientWidth * ratio)));
        const height = Math.max(1, Math.min(viewportLimit[1], Math.round(canvas.clientHeight * ratio)));
        const resized = width !== canvas.width || height !== canvas.height;
        if (!resized && foldDegrees === previousDegrees) return;
        if (resized) { canvas.width = width; canvas.height = height; }
        context.viewport(0, 0, width, height);
        const geometry = desktopProjection(foldDegrees);
        const surface = desktopShading(foldDegrees, image.naturalHeight);
        context.uniform1f(fold, geometry.radians);
        context.uniform4f(projection, geometry.sine, geometry.cosine, geometry.topWidth, geometry.progress);
        context.uniform4f(shading, surface.frost, surface.broadShadow, surface.contactShadow, surface.contactWidth);
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
        previousDegrees = foldDegrees;
        canvas.dataset.renderer = 'ready';
      } catch { fail(); }
    };
    render(0);
    if (disposed || context.getError() !== context.NO_ERROR) { fail(); return null; }
    return { render, dispose };
  } catch {
    fail();
    return null;
  }
}
