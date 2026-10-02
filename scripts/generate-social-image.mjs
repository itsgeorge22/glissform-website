import { copyFile, mkdir } from 'node:fs/promises';

// Publish the owner-approved artwork byte for byte, without re-rendering fonts.
await mkdir('public/assets', { recursive: true });
await copyFile('artwork/glissform-social.png', 'public/assets/glissform-social.png');
