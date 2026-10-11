import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Box3, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector3 } from 'three';
import { configureThreeCamera, createMacBookEnclosure, createMacBookTouchID, macBookDimensions } from '../src/home-next/threeHardware.ts';
import { displayMapping, displayDimensions } from '../src/home-next/displayGeometry.ts';
import { scenePose, screenPose } from '../src/home-next/choreography.ts';
import { compose, projectQuad, translate } from '../src/hero-test-animation/sceneProjection.ts';
import { sceneProjection } from '../src/home-next/sceneProjection.ts';
import { unprojectPlanePoint } from '../src/hero-test-animation/projectedPointer.ts';

const close = (actual, expected, tolerance = .0001) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
const detailBytes = await fs.readFile(new URL('../public/models/macbook-details.glb', import.meta.url));
const description = JSON.parse(detailBytes.subarray(20, 20 + detailBytes.readUInt32LE(12)));
const imported = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
  detailBytes.buffer.slice(detailBytes.byteOffset, detailBytes.byteOffset + detailBytes.byteLength), '');
imported.scene.updateMatrixWorld(true);

test('the detail asset retains the Pro hinge and excludes the replaced keyboard and display plastic', () => {
  assert.ok(detailBytes.length < 100_000);
  assert.match(description.asset.copyright, /Apple/);
  assert.deepEqual(description.nodes.filter(n => n.mesh !== undefined).map(n => n.name).sort(),
    ['Clutch_Cover', 'Hinge_Axle', 'Hinge_Mounts', 'Hinge_Upper', 'Lid_Clutch'].sort());
});

test('Touch ID is a shallow well below the key, with an open circular aperture', () => {
  const key = { x: 700, y: 470, width: 40, height: 37 }, d = macBookDimensions;
  const parts = createMacBookTouchID(key), material = new MeshBasicMaterial();
  const x = (d.drawingWidth - d.width) / 2 + key.x + key.width / 2, z = d.depth - key.y - key.height / 2;
  const ray = (px) => new Raycaster(new Vector3(px, d.depth - 20, z), new Vector3(0, 1, 0));
  try {
    assert.equal(ray(x).intersectObject(new Mesh(parts.top, material)).length, 0, 'no flat key face covers the well');
    const top = ray(x + 15).intersectObject(new Mesh(parts.top, material))[0];
    const sensor = ray(x).intersectObject(new Mesh(parts.sensor, material))[0];
    assert.ok(top && sensor, 'both surfaces face the viewer above the keyboard');
    assert.ok(sensor.point.y > top.point.y + .3 && sensor.point.y < top.point.y + .8, 'the sensor is subtly recessed');
    for (const part of Object.values(parts)) {
      assert.ok(part.boundingBox.min.y >= top.point.y - .0001, 'no raised ring above the key surface');
      assert.ok([...part.getAttribute('normal').array].every(Number.isFinite));
    }
  } finally { Object.values(parts).forEach(part => part.dispose()); material.dispose(); }
});

test('the Pro scoop replaces the deck at the original 118 by 9 by 4.2 size', () => {
  const parts = createMacBookEnclosure(), material = new MeshBasicMaterial(), d = macBookDimensions;
  const size = parts.scoop.boundingBox.getSize(new Vector3());
  close(size.x, 118, .001); close(size.z, 9, .001); close(size.y, 4.2, .001);
  close(parts.scoop.boundingBox.max.z, d.depth, .001);
  const ray = new Raycaster(new Vector3(450, d.depth - 20, d.depth - 3), new Vector3(0, 1, 0));
  assert.equal(ray.intersectObject(new Mesh(parts.deck, material)).length, 0);
  const hit = ray.intersectObject(new Mesh(parts.scoop, material))[0];
  assert.ok(hit && hit.point.y > d.depth + 3.5 && hit.point.y < d.depth + 7.2);
  assert.ok(parts.scoop.getAttribute('position').count > 30, 'the curved source shoulders remain');
  for (const part of Object.values(parts)) assert.ok([...part.getAttribute('normal').array].every(Number.isFinite));
  Object.values(parts).forEach(g => g.dispose()); material.dispose();
});

test('the retained Pro hinge is seated inside the original base', () => {
  const d = macBookDimensions, body = createMacBookEnclosure();
  for (const name of ['Clutch_Cover', 'Hinge_Axle', 'Hinge_Mounts', 'Hinge_Upper']) {
    const b = new Box3().setFromObject(imported.scene.getObjectByName(name));
    assert.ok(b.max.y < body.underside.boundingBox.max.y, `${name} stays above the underside`);
    assert.ok(b.min.y > body.deck.boundingBox.min.y, `${name} sits below the deck`);
    assert.ok(b.min.z < 35 && b.max.z < 35, `${name} fits the rear pocket`);
  }
  const clutch = imported.scene.getObjectByName('Lid_Clutch');
  for (const fold of [0, 15, 30, 60, 30, 0]) {
    const pivot = new Matrix4().makeTranslation(450, d.depth + d.hingeDrop, 0)
      .multiply(new Matrix4().makeRotationX(-fold * Math.PI / 180));
    const b = new Box3().setFromObject(clutch).applyMatrix4(pivot);
    assert.ok(b.max.y < body.underside.boundingBox.max.y, 'moving clutch stays inside the body envelope');
  }
  Object.values(body).forEach(g => g.dispose());
});

test('the centered sweep stays inside the final frame and never reverses its travel', () => {
  const d = macBookDimensions, enclosure = createMacBookEnclosure();
  for (const [width, height] of [[900, 600], [1280, 460], [952, 1001], [1280, 720], [1440, 900], [1920, 1080], [3440, 1440]]) {
    const openingHeight = Math.max(720, height);
    let previousFold = 0, previousCenter;
    const start = sceneProjection(scenePose(0, width, height, openingHeight), width, height, openingHeight).bounds;
    const direction = Math.sign(scenePose(1, width, height, openingHeight).centerY - (start.top + start.bottom) / 2);
    for (let i = 0; i <= 100; i++) {
      const pose = scenePose(i / 100, width, height, openingHeight);
      assert.equal(pose.x, 0);
      assert.ok(pose.fold >= previousFold && pose.fold <= 62); previousFold = pose.fold;
      const projection = sceneProjection(pose, width, height, openingHeight);
      assert.ok(projection.visible);
      const bounds = projection.bounds, center = (bounds.top + bounds.bottom) / 2;
      close((bounds.left + bounds.right) / 2, width / 2, .01);
      if (previousCenter !== undefined) assert.ok((center - previousCenter) * direction >= -.001, 'no up-then-down recentering');
      previousCenter = center;
    }
    const pose = scenePose(1, width, height, openingHeight), projection = sceneProjection(pose, width, height, openingHeight);
    close(90 - pose.fold, 28);
    close(pose.yaw, -18); close(pose.roll, -4);
    const model = new Matrix4().fromArray(projection.model);
    const lid = new Matrix4().makeTranslation(450, d.depth + d.hingeDrop, 0)
      .multiply(new Matrix4().makeRotationX(-pose.fold * Math.PI / 180))
      .multiply(new Matrix4().makeTranslation(0, 0, -d.lidRecess));
    const points = [];
    for (const [part, transform] of [[enclosure.base, model], [enclosure.lid, model.clone().multiply(lid)]]) {
      const p = part.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const v = new Vector3().fromBufferAttribute(p, i).applyMatrix4(transform), ray = 1 - v.z / projection.perspective;
        points.push([width / 2 + (v.x - width / 2) / ray, height / 2 + (v.y - height / 2) / ray]);
      }
    }
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    // The framing envelope uses box corners; rounded case corners differ by
    // a few pixels when the laptop turns, while its envelope stays exact.
    close((Math.min(...xs) + Math.max(...xs)) / 2, width / 2, 4);
    close((Math.min(...ys) + Math.max(...ys)) / 2, pose.centerY, 4);
    assert.ok(Math.min(...xs) > 20 && Math.max(...xs) < width - 20);
    assert.ok(Math.min(...ys) > height * .4 && Math.max(...ys) < height - 20, 'the final Mac clears the heading and stays inside the viewport');
  }
  Object.values(enclosure).forEach(g => g.dispose());
});

test('the original enclosure retains its shell dimensions and outward face normals', () => {
  const parts = createMacBookEnclosure();
  const { width, depth } = macBookDimensions;
  try {
    close(parts.rim.boundingBox.min.x, -width / 2);
    close(parts.rim.boundingBox.max.x, width / 2);
    close(parts.rim.boundingBox.min.y, -depth);
    close(parts.rim.boundingBox.max.y, 0);
    close(parts.front.boundingBox.max.x, width / 2 - 1.1);
    close(parts.lid.boundingBox.min.z, -6);
    close(parts.lid.boundingBox.max.z, 0);
    close(parts.base.boundingBox.min.y, depth + 3);
    close(parts.base.boundingBox.max.y, depth + 20);
    close(parts.underside.boundingBox.max.x - parts.underside.boundingBox.min.x, width - 22);
    for (const [name, expected] of [['front', [0, 0, 1]], ['back', [0, 0, -1]], ['deck', [0, -1, 0]], ['underside', [0, 1, 0]]]) {
      const normals = parts[name].getAttribute('normal');
      for (let index = 0; index < normals.count; index++) {
        close(normals.getX(index), expected[0]); close(normals.getY(index), expected[1]); close(normals.getZ(index), expected[2]);
      }
    }
    for (const part of Object.values(parts)) {
      assert.ok([...part.getAttribute('position').array, ...part.getAttribute('normal').array].every(Number.isFinite));
      assert.ok(part.getIndex().count > 0);
    }
  } finally { Object.values(parts).forEach(part => part.dispose()); }
});

test('the fixed physical aperture fits the original 16px opening without resizing its HTML contents', () => {
  for (const [width, height] of [[900, 600], [1156, 720], [1440, 900], [1920, 1080], [3440, 1440]]) {
    const openingHeight = Math.max(720, height);
    const mapping = displayMapping(width, openingHeight);
    close(mapping.x + 16 * mapping.scaleX, displayDimensions.side);
    close(mapping.y + 16 * mapping.scaleY, displayDimensions.top);
    close(mapping.x + (width - 16) * mapping.scaleX, macBookDimensions.width - displayDimensions.side);
    close(mapping.y + (openingHeight - 16) * mapping.scaleY, macBookDimensions.depth - displayDimensions.bottom);
    const pose = scenePose(0, width, height, openingHeight);
    const opening = sceneProjection(pose, width, height, openingHeight);
    const corners = projectQuad(opening.screen, width, openingHeight);
    for (const [i, x, y] of [[0, 0, 0], [1, width, 0], [2, width, openingHeight], [3, 0, openingHeight]]) {
      close(corners[i].x, x); close(corners[i].y, y);
    }
    // Wide opening views crop the full-size native case outside the viewport.
    // Near the compact breakpoint, the slimmer case can already fit in view;
    // the unchanged HTML opening above still supplies its exact 16px frame.
    if (width >= 1156) assert.ok(mapping.x > 0 && mapping.y > 0);
  }
});

test('the lowered DOM display agrees with the physical lid at every reveal and closing pose', () => {
  const width = 1440, height = 900, d = macBookDimensions;
  const mapping = displayMapping(width, height);
  for (const progress of [0, .001, .02, .06, .1299, .13, .1301, .35, .55, .8, 1, .8, .35, .13, .02, 0]) {
    const pose = scenePose(progress, width, height), projection = sceneProjection(pose, width, height, height);
    const model = new Matrix4().fromArray(projection.model);
    const lid = new Matrix4().makeTranslation(450, d.depth + d.hingeDrop, 0)
      .multiply(new Matrix4().makeRotationX(-pose.fold * Math.PI / 180))
      .multiply(new Matrix4().makeTranslation(0, 0, -d.lidRecess));
    const corners = projectQuad(projection.screen, width, height);
    for (const [i, x, y] of [[0, 0, 0], [1, width, 0], [2, width, height], [3, 0, height]]) {
      const p = new Vector3(mapping.x + x * mapping.scaleX - d.width / 2,
        mapping.y + y * mapping.scaleY - d.depth, 0).applyMatrix4(lid).applyMatrix4(model);
      const ray = 1 - p.z / projection.perspective;
      close(corners[i].x, width / 2 + (p.x - width / 2) / ray);
      close(corners[i].y, height / 2 + (p.y - height / 2) / ray);
    }
  }
});

test('the unchanged live screen and projected controls follow the lid in both scroll directions', () => {
  const width = 1440, height = 900;
  for (const progress of [0, .02, .06, .12, .25, .4, .6, .4, .12, .02, 0]) {
    const pose = scenePose(progress, width, height);
    const camera = sceneProjection(pose, width, height, height);
    if (!camera.visible) continue;
    const w = width - 32, h = height - 32;
    const matrix = compose(camera.screen, translate(16, 16), screenPose(pose.fold, w, h).matrix);
    const quad = projectQuad(matrix, w, h);
    const x = w * .7, y = h * .6;
    const divisor = matrix[3] * x + matrix[7] * y + matrix[15];
    const point = { x: (matrix[0] * x + matrix[4] * y + matrix[12]) / divisor,
      y: (matrix[1] * x + matrix[5] * y + matrix[13]) / divisor };
    const inverse = unprojectPlanePoint(point, quad, w, h);
    assert.ok(inverse); close(inverse.x, x); close(inverse.y, y);
  }
});

test('the Three.js camera maps CSS scene points to the exact same viewport pixels', () => {
  const camera = new PerspectiveCamera();
  for (const [width, height] of [[1156, 648], [1440, 900], [1920, 1080], [3440, 1440]]) {
    const perspective = Math.max(2400, width * 2.5);
    configureThreeCamera(camera, width, height, perspective);
    for (const [x, y, z] of [[0, 0, 0], [width, height, 0], [width * .3, height * .7, 450], [width * .6, height * .2, -620], [width / 2, height / 2, 90]]) {
      const clip = new Vector3(x, -y, z).project(camera);
      const actual = [(clip.x + 1) * width / 2, (1 - clip.y) * height / 2];
      const ray = 1 - z / perspective;
      close(actual[0], width / 2 + (x - width / 2) / ray, 1e-9);
      close(actual[1], height / 2 + (y - height / 2) / ray, 1e-9);
    }
  }
});


test('the ending settles without jumps and reverses through the same screen positions', () => {
  const width = 1280, height = 720;
  for (const boundary of [.08, .18, .32, .34, .45, .52, .62, .78, .90, .94, 1]) {
    const before = sceneProjection(scenePose(boundary - .000001, width, height), width, height, height);
    const after = sceneProjection(scenePose(boundary + .000001, width, height), width, height, height);
    const a = projectQuad(before.screen, width, height), b = projectQuad(after.screen, width, height);
    a.forEach((point, i) => { close(point.x, b[i].x, .03); close(point.y, b[i].y, .03); });
  }
  const opening = scenePose(0, width, height), final = scenePose(1, width, height);
  assert.equal(opening.navigation, 0);
  assert.equal(final.navigation, 1);
  assert.equal(opening.screenNavigation, 1); assert.equal(final.screenNavigation, 0);
  assert.deepEqual(scenePose(2, width, height), final, 'continuing downward holds the completed composition');
  const forward = [.58, .65, .75, .85, 1].map(p => sceneProjection(scenePose(p, width, height), width, height, height).screen);
  for (const [i, p] of [1, .85, .75, .65, .58].entries())
    assert.deepEqual(sceneProjection(scenePose(p, width, height), width, height, height).screen, forward[forward.length - 1 - i]);
});
