import { timingSafeEqual, createHash } from 'node:crypto';
import { driveClient, inventory } from '../scripts/drive-media.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  const hash = s => createHash('sha256').update(s).digest();
  if (!process.env.CRON_SECRET || !timingSafeEqual(hash(req.headers.authorization || ''), hash('Bearer ' + process.env.CRON_SECRET))) {
    return res.status(401).end();
  }
  try {
    const {digest} = await inventory(await driveClient());
    const live = await fetch('https://chronica3000.com/drive-media-version.txt?check=' + Date.now());
    if (!live.ok && live.status !== 404) throw new Error('Production version unavailable');
    if (live.ok && (await live.text()).trim() === digest) return res.status(200).send('Up to date');
    const deployed = await fetch(process.env.VERCEL_DEPLOY_HOOK, {method:'POST'});
    if (!deployed.ok) throw new Error('Deploy hook failed');
    return res.status(202).send('Build requested');
  } catch {
    return res.status(502).send('Media check failed. Check Drive access, file names and deployment settings.');
  }
}
