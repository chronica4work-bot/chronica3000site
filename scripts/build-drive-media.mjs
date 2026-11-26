import { createHash } from 'node:crypto';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { driveClient, inventory } from './drive-media.mjs';

export async function overlay(client, root, files) {
  for (const file of files) {
    const dest = join(root, file.path);
    const directory = dirname(dest);
    await mkdir(directory, {recursive:true});
    const hash = createHash('md5');
    const body = (await client.download(file.id)).body;
    await pipeline(body, new Transform({transform(chunk, _, done) {
      hash.update(chunk);
      done(null, chunk);
    }}), createWriteStream(dest + '.partial'));
    if (hash.digest('hex') !== file.md5) throw new Error('Media changed during download: ' + file.path);
    const gallery = file.path.split('/').length === 3;
    for (const name of await readdir(directory)) {
      const matches = gallery ? name.toLowerCase() === parse(dest).base.toLowerCase()
        : parse(name).name.toLowerCase() === parse(dest).name && /\.(jpg|jpeg|png|webp|avif|mp4|webm|mov)$/i.test(name);
      if (matches) await rm(join(directory, name));
    }
    await rename(dest + '.partial', dest);
  }
}
if (process.env.VERCEL === '1' && process.env.DRIVE_SERVICE_ACCOUNT_JSON) {
  const client = await driveClient();
  const {files, digest} = await inventory(client);
  await overlay(client, 'src/content/projects', files);
  await writeFile('public/drive-media-version.txt', digest + '\n');
}
