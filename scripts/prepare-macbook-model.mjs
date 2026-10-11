// Prepare a temporary Silver source for the selected-detail conversion.
// Run on macOS, where usdcat is available. Full-model files stay in /tmp.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { Box3, Group, Matrix4, Mesh, Texture, Vector3 } from 'three';
import { USDCParser } from 'three/addons/loaders/usd/USDCParser.js';
import { USDComposer } from 'three/addons/loaders/usd/USDComposer.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { unzipSync } from 'three/addons/libs/fflate.module.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceURL = 'https://www.apple.com/105/media/us/macbook-pro/2025/785e1bc4-d1bd-4cf4-b1b3-94b9411c9e74/ar/macbook-pro-14-in-space-black-variant.usdz';
const work = '/tmp/glissform-m5-model';
await fs.mkdir(work, { recursive: true });
const original = path.join(work, 'macbook-pro-m5.usdz');
try { await fs.access(original); } catch {
  const response = await fetch(sourceURL);
  if (!response.ok) throw Error(`Model download failed: ${response.status}`);
  await fs.writeFile(original, new Uint8Array(await response.arrayBuffer()));
}
const zip = unzipSync(await fs.readFile(original));
const source = path.join(work, 'source');
for (const [name, bytes] of Object.entries(zip)) {
  const destination = path.resolve(source, name);
  if (!destination.startsWith(source + path.sep)) throw Error('Invalid USDZ entry');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes);
}
const rootLayer = path.join(work, 'root.usda');
execFileSync('/usr/bin/usdcat', [original, '-o', rootLayer]);
const layer = await fs.readFile(rootLayer, 'utf8');
if (!layer.includes('string Color = "Space_Black"') || !layer.includes('"Silver"')) throw Error('Expected M5 color variants');
const silverLayer = path.join(source, 'silver.usda');
await fs.writeFile(silverLayer, layer.replace('string Color = "Space_Black"', 'string Color = "Silver"'));
const flat = path.join(work, 'silver-flat.usdc');
execFileSync('/usr/bin/usdcat', ['--flatten', silverLayer, '-o', flat]);

// Keep texture bytes on the build side; no browser/image emulation is needed.
const assets = {}, imageNames = new Map();
for (const [name, bytes] of Object.entries(zip)) if (!name.endsWith('.usdc')) {
  assets[path.join(source, name)] = bytes;
  imageNames.set(bytes, name);
}
class AssetComposer extends USDComposer {
  _createTextureFromData(data, attrs, transform) {
    const texture = new Texture();
    texture.userData.file = imageNames.get(data);
    texture.wrapS = this._getWrapMode(attrs?.['inputs:wrapS']);
    texture.wrapT = this._getWrapMode(attrs?.['inputs:wrapT']);
    this._applyTextureTransforms(texture, transform);
    return texture;
  }
}
const raw = await fs.readFile(flat);
const model = new AssetComposer().compose(new USDCParser().parseData(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)), assets);
model.updateMatrixWorld(true);
const originalLid = model.getObjectByName('RcexTyyhpuJYATQ');
const originalScreen = model.getObjectByName('tfTbkkzhxqpKRgC');
if (!originalLid || !originalScreen) throw Error('M5 lid/display hierarchy changed');
const pivot = new Vector3(.000039876602, -.09006241, -10.7805395).multiplyScalar(.01);
const screenGeometry = originalScreen.geometry.clone().applyMatrix4(originalScreen.matrixWorld);
const screenPositions = screenGeometry.getAttribute('position');
const points = Array.from({ length: screenPositions.count }, (_, i) => new Vector3().fromBufferAttribute(screenPositions, i));
const low = points.reduce((a, b) => a.y < b.y ? a : b), high = points.reduce((a, b) => a.y > b.y ? a : b);
const upright = new Matrix4().makeRotationX(Math.atan2(low.z - high.z, high.y - low.y));
const origin = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
const lidTransform = upright.clone().multiply(origin);
const group = new Group(); group.name = 'MacBook_Pro_14_M5_Silver';
const base = new Group(); base.name = 'Base'; group.add(base);
const lid = new Group(); lid.name = 'Lid'; group.add(lid);
const names = {
  tfTbkkzhxqpKRgC: 'Display', KjpcUkkMjGYeXkV: 'Lid_Aluminium', xiLiwJHfkqIwaTs: 'Lid_Apple_Mark',
  CFihWZPNFpzuzyX: 'Speaker_Grilles', WzbwnVztmigkRgn: 'Trackpad', LsmCMkPRBVEEGpg: 'Keycaps',
  wyClPAIazRlKQnt: 'Key_Legends', EBRhBFNqcMTaWWv: 'Touch_ID', AQdtiiJfiakvCKx: 'Enclosure',
  UcEDhfwzyyGMEfj: 'Finger_Recess', qbFEMXRbwPWbFTN: 'Deck', WZqbfOdYdlPMpRs: 'Underside',
};
const paints = new Map();
let triangles = 0;
model.traverse(object => {
  if (!object.isMesh) return;
  let parent = object, onLid = false;
  while (parent) { if (parent === originalLid) onLid = true; parent = parent.parent; }
  let geometry = object.geometry.clone().applyMatrix4(object.matrixWorld).applyMatrix4(onLid ? lidTransform : origin);
  geometry = mergeVertices(geometry, 1e-6);
  const material = object.material.clone();
  const name = names[object.name] ?? `${onLid ? 'Lid' : 'Base'}_${object.name}`;
  const maps = {};
  for (const [key, value] of Object.entries(material)) if (value?.isTexture) {
    maps[key] = { file: value.userData.file, channel: value.channel };
    material[key] = null;
  }
  if (name === 'Display') {
    for (const key of Object.keys(maps)) delete maps[key];
    material.color.set(0); material.emissive.set(0); material.metalness = 0; material.roughness = 1;
  }
  material.name = name;
  material.normalScale.set(1, 1);
  paints.set(name, { maps, material, hasUV1: !!geometry.getAttribute('uv1') });
  const mesh = new Mesh(geometry, material); mesh.name = name;
  (onLid ? lid : base).add(mesh);
  triangles += geometry.index.count / 3;
});
const display = lid.getObjectByName('Display');
display.geometry.computeBoundingBox();
const aperture = display.geometry.boundingBox;
const lcd = display.geometry.getAttribute('position');
const notchPoints = Array.from({ length: lcd.count }, (_, i) => new Vector3().fromBufferAttribute(lcd, i))
  .filter(point => Math.abs(point.x) < .04 && point.y > aperture.max.y - .015);
const notchWidth = 2 * Math.max(...notchPoints.map(point => Math.abs(point.x)));
const notchHeight = aperture.max.y - Math.min(...notchPoints.map(point => point.y));
const baseBox = new Box3().setFromObject(base), lidBox = new Box3().setFromObject(lid);
const metadata = {
  source: sourceURL, variant: 'Silver', triangles,
  width: baseBox.max.x - baseBox.min.x, depth: baseBox.max.z - baseBox.min.z,
  hinge: pivot.toArray(),
  display: { left: aperture.min.x, right: aperture.max.x, top: aperture.max.y, bottom: aperture.min.y, z: aperture.max.z,
    notchWidth, notchHeight, cornerRadius: .007574 },
  baseBounds: [baseBox.min.toArray(), baseBox.max.toArray()], lidBounds: [lidBox.min.toArray(), lidBox.max.toArray()],
};
group.userData = metadata;

globalThis.FileReader = class {
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:application/octet-stream;base64,${Buffer.from(buffer).toString('base64')}`; this.onloadend?.(); }); }
};
const gltf = await new GLTFExporter().parseAsync(group, { binary: false, copyright: 'Copyright (c) 2025 Apple Inc. All rights reserved.' });
const chunks = [Buffer.from(gltf.buffers[0].uri.split(',')[1], 'base64')];
let byteLength = chunks[0].length;
const append = data => {
  const pad = (4 - byteLength % 4) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); byteLength += pad; }
  const view = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: data.length });
  chunks.push(data); byteLength += data.length; return view;
};
gltf.images = []; gltf.textures = [];
gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
const textureCache = new Map();
const image = async (file, mode = 'image') => {
  const key = `${file}:${mode}`;
  if (textureCache.has(key)) return textureCache.get(key);
  let input = sharp(zip[file]).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).flip();
  if (mode === 'alpha') {
    const { data, info } = await input.removeAlpha().extractChannel(0).raw().toBuffer({ resolveWithObject: true });
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < data.length; i++) rgba[i * 4 + 3] = data[i];
    input = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
  }
  const hasAlpha = mode === 'alpha' || !(await sharp(zip[file]).stats()).isOpaque;
  const bytes = await (hasAlpha ? input.png() : input.jpeg({ quality: 88 })).toBuffer();
  const index = gltf.textures.length;
  gltf.images.push({ bufferView: append(bytes), mimeType: hasAlpha ? 'image/png' : 'image/jpeg' });
  gltf.textures.push({ sampler: 0, source: gltf.images.length - 1 }); textureCache.set(key, index);
  return index;
};
for (const material of gltf.materials) {
  const { maps, hasUV1 } = paints.get(material.name);
  const ref = async descriptor => ({ index: await image(descriptor.file), texCoord: descriptor.channel === 1 && hasUV1 ? 1 : 0 });
  if (maps.map) material.pbrMetallicRoughness.baseColorTexture = await ref(maps.map);
  if (maps.normalMap) material.normalTexture = { ...await ref(maps.normalMap), scale: 1 };
  if (maps.aoMap) material.occlusionTexture = await ref(maps.aoMap);
  // USD has separate scalar roughness/metalness maps; glTF packs G/B channels.
  if (maps.roughnessMap || maps.metalnessMap) {
    const key = `packed:${maps.roughnessMap?.file}:${maps.metalnessMap?.file}`;
    if (textureCache.has(key)) {
      material.pbrMetallicRoughness.metallicRoughnessTexture = { index: textureCache.get(key) };
      continue;
    }
    const descriptor = maps.roughnessMap ?? maps.metalnessMap;
    const meta = await sharp(zip[descriptor.file]).metadata();
    const width = Math.min(512, meta.width), height = Math.max(1, Math.round(meta.height * width / meta.width));
    const channel = async d => d ? sharp(zip[d.file]).resize(width, height).flip().removeAlpha().extractChannel(0).raw().toBuffer() : Buffer.alloc(width * height, 255);
    const rough = await channel(maps.roughnessMap), metal = await channel(maps.metalnessMap);
    const pixels = Buffer.alloc(width * height * 3, 255);
    for (let i = 0; i < rough.length; i++) { pixels[i * 3 + 1] = rough[i]; pixels[i * 3 + 2] = metal[i]; }
    const bytes = await sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg({ quality: 88 }).toBuffer();
    const index = gltf.textures.length;
    gltf.images.push({ bufferView: append(bytes), mimeType: 'image/jpeg' });
    gltf.textures.push({ sampler: 0, source: gltf.images.length - 1 });
    material.pbrMetallicRoughness.metallicRoughnessTexture = { index };
    textureCache.set(key, index);
  }
  // USDComposer does not yet import connected opacity; preserve the perforated
  // speaker decal instead of exporting two solid black rectangles.
  if (material.name === 'Speaker_Grilles') {
    const alpha = Object.keys(zip).find(name => name.endsWith('/yZHxHesWWWUpuZv.jpg'));
    material.pbrMetallicRoughness.baseColorTexture = { index: await image(alpha, 'alpha') };
    material.alphaMode = 'BLEND';
  }
}
gltf.buffers = [{ byteLength }];
const binary = Buffer.concat(chunks), binPadding = Buffer.alloc((4 - binary.length % 4) % 4);
const json = Buffer.from(JSON.stringify(gltf)), jsonPadding = Buffer.alloc((4 - json.length % 4) % 4, 32);
const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + jsonPadding.length + binary.length + binPadding.length, 8);
jsonHeader.writeUInt32LE(json.length + jsonPadding.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
binHeader.writeUInt32LE(binary.length + binPadding.length); binHeader.writeUInt32LE(0x004e4942, 4);
const output = Buffer.concat([header, jsonHeader, json, jsonPadding, binHeader, binary, binPadding]);
const unpacked = path.join(work, 'silver-uncompressed.glb');
await fs.writeFile(unpacked, output);
const destination = path.join(work, 'silver.glb');
execFileSync(path.join(root, 'node_modules/.bin/gltfpack'), ['-i', unpacked, '-o', destination, '-cc', '-kn', '-km', '-ke', '-vpf', '-vp', '18']);
// gltfpack drops asset.copyright even with -ke; restore the source notice.
const packed = await fs.readFile(destination), packedJSONLength = packed.readUInt32LE(12);
const packedJSON = JSON.parse(packed.subarray(20, 20 + packedJSONLength));
packedJSON.asset.copyright = gltf.asset.copyright;
const noticeJSON = Buffer.from(JSON.stringify(packedJSON));
const noticePadding = Buffer.alloc((4 - noticeJSON.length % 4) % 4, 32);
const packedBinary = packed.subarray(20 + packedJSONLength), packedHeader = Buffer.from(packed.subarray(0, 20));
packedHeader.writeUInt32LE(20 + noticeJSON.length + noticePadding.length + packedBinary.length, 8);
packedHeader.writeUInt32LE(noticeJSON.length + noticePadding.length, 12);
await fs.writeFile(destination, Buffer.concat([packedHeader, noticeJSON, noticePadding, packedBinary]));
await fs.writeFile(path.join(work, 'model-metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ bytes: (await fs.stat(destination)).size, ...metadata }, null, 2));
