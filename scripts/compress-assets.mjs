import { readdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

for (const file of await readdir('dist/assets')) {
  if (!/\.(js|css|svg)$/.test(file)) continue;
  const source = await readFile(`dist/assets/${file}`);
  const compressed = gzipSync(source, { level: 9 });
  if (compressed.length >= source.length) continue;
  await writeFile(`dist/assets/${file}.gz`, compressed);
  console.log(`${file}: ${source.length} → ${compressed.length} bytes with gzip`);
}
