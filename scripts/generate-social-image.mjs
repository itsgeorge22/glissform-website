import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

// Downsample the approved artwork without cropping or re-rendering its contents.
await mkdir('public/assets', { recursive: true });
await sharp('artwork/glissform-social.png')
  .resize(1200, 630, { fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile('public/assets/glissform-social.png');
