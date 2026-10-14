import { readdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const assets = `${process.env.DEPLOY_V2 === '1' ? 'dist-v2' : 'dist'}/assets`;
for (const file of await readdir(assets)) {
  if (!/\.(js|css|svg)$/.test(file)) continue;
  const source = await readFile(`${assets}/${file}`);
  const compressed = gzipSync(source, { level: 9 });
  if (compressed.length >= source.length) continue;
  await writeFile(`${assets}/${file}.gz`, compressed);
  console.log(`${file}: ${source.length} → ${compressed.length} bytes with gzip`);
}
