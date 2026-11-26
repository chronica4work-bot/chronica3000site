import { createHash, sign } from 'node:crypto';

// Only these folders are scanned. Shortcuts and native Google documents are ignored.
const root = '18BdO6XVkho7g36A6W8ARL9NEXxsY-doR';
const folder = 'application/vnd.google-apps.folder';
export const projects = new Set('realmadridfc27 fc27pepevarane ocbxfms2024 morkillbillcoffin 52haunted fancytearz fullmoon mastersofrosinnewyork mastersofrosinzisdead ocbxfms ocbxmonegros only1heart pinkblues psychodreams2 tomsorry'.split(' '));
const folderSlugs = new Map([
  ['1nySbiXNE7f7So-I2CmNSzxii4tDnQ1h2', 'fc27pepevarane'],
  ['1HnJKpPHMfWde7uKsbNUARGiZGJpx6dqQ', 'realmadridfc27'],
]);
const api = 'https://www.googleapis.com/drive/v3/files';

async function checked(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Drive request failed (HTTP ' + response.status + ')');
  return response;
}

export async function driveClient() {
  const key = JSON.parse(process.env.DRIVE_SERVICE_ACCOUNT_JSON);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const endpoint = 'https://oauth2.googleapis.com/token';
  const payload = encode({alg:'RS256',typ:'JWT'}) + '.' + encode({
    iss:key.client_email, scope:'https://www.googleapis.com/auth/drive.readonly',
    aud:endpoint, iat:now, exp:now+3600,
  });
  const assertion = payload + '.' + sign('RSA-SHA256', Buffer.from(payload), key.private_key).toString('base64url');
  const token = await checked(endpoint, {method:'POST', body:new URLSearchParams({
    grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion,
  })}).then(r => r.json());
  const headers = {Authorization:'Bearer ' + token.access_token};
  return {
    async list(id) {
      const items = [];
      let pageToken;
      do {
        const params = new URLSearchParams({q:"'" + id + "' in parents and trashed=false",
          fields:'nextPageToken,incompleteSearch,files(id,name,mimeType,md5Checksum,size)',pageSize:'1000',
          supportsAllDrives:'true',includeItemsFromAllDrives:'true'});
        if (pageToken) params.set('pageToken', pageToken);
        const page = await checked(api + '?' + params, {headers}).then(r => r.json());
        if (page.incompleteSearch) throw new Error('Incomplete Drive listing');
        items.push(...page.files);
        pageToken = page.nextPageToken;
      } while (pageToken);
      return items;
    },
    download: id => checked(api + '/' + encodeURIComponent(id) + '?alt=media&supportsAllDrives=true', {headers}),
  };
}

export async function inventory(client) {
  const seen = new Set();
  const files = [];
  function unique(path) {
    const key = path.toLowerCase();
    if (seen.has(key)) throw new Error('Duplicate media name or role: ' + path);
    seen.add(key);
  }
  async function scan(id, prefix, gallery) {
    for (const item of await client.list(id)) {
      const name = item.name;
      if (!gallery && item.mimeType === folder && ['stills','bts'].includes(name)) {
        unique(prefix + '/' + name);
        await scan(item.id, prefix + '/' + name, true);
        continue;
      }
      const image = /\.(jpg|jpeg|png|webp|avif)$/i.test(name) && item.mimeType.startsWith('image/');
      const video = /^(main\.(mp4|webm|mov)|(highlight|hover)\.(mp4|webm))$/i.test(name) && item.mimeType.startsWith('video/');
      if (gallery ? !image : !(image && /^poster\.(jpg|jpeg|png|webp|avif)$/i.test(name) || video)) continue;
      if (!/^[\p{L}\p{N}_-][\p{L}\p{N} _().-]*$/u.test(name)) throw new Error('Unsupported media filename in ' + prefix);
      if (!item.md5Checksum || Number(item.size) <= 0) throw new Error('Incomplete media in ' + prefix);
      const filename = gallery ? name.replace(/\.[^.]+$/, ext => ext.toLowerCase()) : name.toLowerCase();
      const path = prefix + '/' + filename;
      unique(gallery ? path : path.replace(/\.[^.]+$/, ''));
      files.push({path, id:item.id, md5:item.md5Checksum});
    }
  }
  // Verify that the account can actually see the configured root.
  for (const item of await client.list(root)) {
    const slug = folderSlugs.get(item.id) ?? item.name;
    if (item.mimeType !== folder || !projects.has(slug)) continue;
    unique(slug);
    await scan(item.id, slug, false);
  }
  if (!seen.size) throw new Error('No project folders visible to Drive reader');
  files.sort((a,b) => a.path < b.path ? -1 : 1);
  const digest = createHash('sha256').update(JSON.stringify(files)).digest('hex');
  return {files, digest};
}
