// Keep selected M5 details, fitted to the original Glissform laptop's native rig.
// The imported keyboard, display plastic and body are excluded.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Box3, Group, Matrix4, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const workDirectory = '/tmp/glissform-m5-model';
const bytes = await fs.readFile(path.join(workDirectory, 'silver.glb'));
const length = bytes.readUInt32LE(12), source = JSON.parse(bytes.subarray(20, 20 + length));
// The selected details use scalar materials. Remove the full model's textures
// before decoding in Node; its finish maps are not needed by our silver scoop.
for (const material of source.materials) {
  for (const key of Object.keys(material)) if (key.endsWith('Texture')) delete material[key];
  for (const key of Object.keys(material.pbrMetallicRoughness ?? {}))
    if (key.endsWith('Texture')) delete material.pbrMetallicRoughness[key];
}
delete source.images; delete source.textures;
const json = Buffer.from(JSON.stringify(source)), pad = Buffer.alloc((4 - json.length % 4) % 4, 32);
const bin = bytes.subarray(20 + length), header = Buffer.from(bytes.subarray(0, 20));
header.writeUInt32LE(20 + json.length + pad.length + bin.length, 8); header.writeUInt32LE(json.length + pad.length, 12);
const input = Buffer.concat([header, json, pad, bin]);
const asset = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
  input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength), '');
asset.scene.updateMatrixWorld(true);
const part = name => {
  const mesh = asset.scene.getObjectByName(name);
  if (!mesh?.isMesh) throw Error(`Missing source detail: ${name}`);
  return mesh;
};
const bounds = mesh => new Box3().setFromObject(mesh, true);
const width = 821.739, depth = 547.826, unit = width / .31172987818717957;
const deckY = bounds(part('Deck')).max.y;
const lcdZ = bounds(part('Display')).max.z;
const hingeDrop = 3 + deckY * unit, lidRecess = -lcdZ * unit;
const group = new Group(); group.name = 'Glissform_M5_Details';
const base = new Group(); base.name = 'Base_Details'; group.add(base);
const lid = new Group(); lid.name = 'Lid_Details'; group.add(lid);
const copy = (sourceName, name, parent, matrix) => {
  const original = part(sourceName), geometry = original.geometry.clone().applyMatrix4(original.matrixWorld).applyMatrix4(matrix);
  // Baked CSS coordinates reverse handedness. Keep the winding consistent
  // with transformed normals; the renderer supplies its own camera conversion.
  if (matrix.determinant() < 0) {
    const indices = geometry.index;
    for (let i = 0; i < indices.count; i += 3) {
      const b = indices.getX(i + 1); indices.setX(i + 1, indices.getX(i + 2)); indices.setX(i + 2, b);
    }
  }
  const mesh = new Mesh(geometry, original.material.clone()); mesh.name = name; mesh.material.name = name;
  parent.add(mesh); return mesh;
};
const hinge = new Matrix4().makeTranslation(450, depth + hingeDrop, 0).multiply(new Matrix4().makeScale(unit, -unit, unit));
for (const [sourceName, name] of [
  ['Base_JXvTyELxHLGtnWp', 'Clutch_Cover'], ['Base_bckGBpxpLXNHmCa', 'Hinge_Axle'],
  ['Base_sIzFavpnYbDfLWk', 'Hinge_Upper'], ['Base_sonZrhRIQDlQHcy', 'Hinge_Mounts'],
]) {
  const mesh = copy(sourceName, name, base, hinge), p = mesh.geometry.getAttribute('position');
  // Keep the source axle in place while fitting its hidden lower mounts inside
  // our original thinner base. No hinge part protrudes through the underside.
  const belowAxis = Math.max(...Array.from({ length: p.count }, (_, i) => p.getY(i) - depth - hingeDrop));
  if (belowAxis > 19 - hingeDrop) {
    const ratio = (19 - hingeDrop) / belowAxis;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > depth + hingeDrop)
      p.setY(i, depth + hingeDrop + (p.getY(i) - depth - hingeDrop) * ratio);
    mesh.geometry.computeVertexNormals();
  }
}
copy('Lid_UEFeUEhkJPdlgXF', 'Lid_Clutch', lid, new Matrix4().makeScale(unit, -unit, unit));
// Preserve our existing 118 × 9 × 4.2 recess envelope, using the source's
// curved shoulders and sloped middle. Store its small mesh beside its cutout.
const scoop = part('Finger_Recess'), scoopBounds = bounds(scoop), scoopSize = scoopBounds.getSize(new Vector3());
const scoopMap = new Matrix4().makeTranslation(450 - 118 / 2 - scoopBounds.min.x * 118 / scoopSize.x,
  depth + 3 + scoopBounds.max.y * 4.2 / scoopSize.y, depth - 9 - scoopBounds.min.z * 9 / scoopSize.z)
  .multiply(new Matrix4().makeScale(118 / scoopSize.x, -4.2 / scoopSize.y, 9 / scoopSize.z));
const recessMesh = copy('Finger_Recess', 'Finger_Recess', new Group(), scoopMap);
const p = recessMesh.geometry.getAttribute('position');
const points = Array.from({ length: p.count }, (_, i) => [p.getX(i), p.getY(i), p.getZ(i)]);
const round = values => values.map(v => +v.toFixed(5));
const unique = values => [...new Map(values.map(v => [v[0].toFixed(3), v])).values()].sort((a, b) => a[0] - b[0]);
const topContour = unique(points.filter(p => p[1] < depth + 3.01).map(p => round([p[0] - (900 - width) / 2, depth - p[2]])));
const frontProfile = unique(points.filter(p => p[2] > depth - .06).map(p => round([p[0] - (900 - width) / 2, p[1] - depth - 3])));
const metadata = {
  source: asset.scene.getObjectByName('MacBook_Pro_14_M5_Silver').userData.source,
  hingeDrop, lidRecess,
  scoop: { width: 118, depth: 9, drop: 4.2, positions: points.flat().map(v => +v.toFixed(5)), indices: [...recessMesh.geometry.index.array], topContour, frontProfile },
};
group.userData = { source: metadata.source, variant: 'Silver', retainedDetails: 'hinge-and-scoop' };
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }); }
};
const exported = await new GLTFExporter().parseAsync(group, { binary: true, copyright: source.asset.copyright });
const work = path.join(workDirectory, 'details-uncompressed.glb');
await fs.writeFile(work, new Uint8Array(exported));
const destination = path.join(root, 'public/models/macbook-details.glb');
await fs.mkdir(path.dirname(destination), { recursive: true });
execFileSync(path.join(root, 'node_modules/.bin/gltfpack'), ['-i', work, '-o', destination, '-cc', '-kn', '-km', '-ke', '-vpf', '-vp', '18']);
const packed = await fs.readFile(destination), jl = packed.readUInt32LE(12), description = JSON.parse(packed.subarray(20, 20 + jl));
description.asset.copyright = source.asset.copyright;
const j = Buffer.from(JSON.stringify(description)), padding = Buffer.alloc((4 - j.length % 4) % 4, 32), binary = packed.subarray(20 + jl), h = Buffer.from(packed.subarray(0, 20));
h.writeUInt32LE(20 + j.length + padding.length + binary.length, 8); h.writeUInt32LE(j.length + padding.length, 12);
await fs.writeFile(destination, Buffer.concat([h, j, padding, binary]));
await fs.writeFile(path.join(root, 'src/home-next/macbook-details.json'), JSON.stringify(metadata) + '\n');
console.log(JSON.stringify({ bytes: (await fs.stat(destination)).size, hingeDrop, lidRecess, parts: [...base.children, ...lid.children].map(m => m.name) }));
