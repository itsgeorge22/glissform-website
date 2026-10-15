import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('artwork');
const output = path.resolve('src/generated/assets');
await mkdir(output, { recursive: true });

for (const file of await readdir(source)) {
  if (!file.endsWith('.png')) continue;
  const input = path.join(source, file);
  const name = file.slice(0, -4);
  const featureWallpaper = name === 'feature-wallpaper';
  // Buttons only paint the top strip; retain its pixels and full horizontal tile.
  const buttonTextureHeight = name === 'button-texture' ? 320 : name === 'try-button-texture' ? 128 : null;
  const sizes = featureWallpaper ? [960, 1920, 2880, 3840]
    : name.endsWith('glissform-icon') ? [64, 128, 256]
    : name === 'seamless-settings' ? [480, 800, 1200, null]
    : name.startsWith('blur-') ? [240, 480, null] : [null];
  for (const size of sizes) {
    const image = sharp(input);
    if (buttonTextureHeight) image.extract({ left: 0, top: 0, width: 1024, height: buttonTextureHeight });
    if (size) image.resize({ width: size, withoutEnlargement: true });
    const target = path.join(output, `${name}${size ? `-${size}` : ''}.webp`);
    await image.webp(featureWallpaper
      ? { quality: 85, effort: 6, smartSubsample: true }
      : buttonTextureHeight ? { lossless: true, quality: 100, effort: 6 }
      : { lossless: true, effort: 6 }).toFile(target);
    console.log(`${path.basename(target)}: ${(await stat(target)).size} bytes`);
  }
}
// Browsers need only a small PNG for the favicon, not the 2048px master.
await sharp(path.join(source, 'glissform-icon.png')).resize(64, 64)
  .png({ compressionLevel: 9 }).toFile(path.join(output, 'favicon.png'));
