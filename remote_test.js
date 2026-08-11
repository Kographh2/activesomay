const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

const decode = (buffer, encoding) => {
  if (encoding === 'gzip') return zlib.gunzipSync(buffer);
  if (encoding === 'deflate') return zlib.inflateSync(buffer);
  if (encoding === 'br') return zlib.brotliDecompressSync(buffer);
  return buffer;
};

const request = (options, body) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const decoded = decode(buffer, res.headers['content-encoding']);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: decoded.toString('utf8') });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
};

const makeCookie = (html) => {
  const keyMatch = html.match(/a=toNumbers\("([^"]+)"\)/);
  const ivMatch = html.match(/b=toNumbers\("([^"]+)"\)/);
  const encryptedMatch = html.match(/c=toNumbers\("([^"]+)"\)/);
  if (!keyMatch || !ivMatch || !encryptedMatch) {
    throw new Error('Missing AES params');
  }
  const key = Buffer.from(keyMatch[1], 'hex');
  const iv = Buffer.from(ivMatch[1], 'hex');
  const encrypted = Buffer.from(encryptedMatch[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('hex');
};

(async () => {
  try {
    const homepage = await request({ hostname: 'alight-motion-premium.site.je', path: '/', method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html', 'Accept-Encoding': 'gzip, deflate, br' }, timeout: 20000 });
    console.log('home status', homepage.statusCode);
    console.log('home headers', homepage.headers['content-type']);
    try {
      const cookie = makeCookie(homepage.body);
      console.log('cookie', cookie.slice(0, 24), '...');
      const i1 = await request({ hostname: 'alight-motion-premium.site.je', path: '/?i=1', method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html', 'Accept-Encoding': 'gzip, deflate, br', 'Cookie': `__test=${cookie}` }, timeout: 20000 });
      console.log('i1 status', i1.statusCode, 'len', i1.body.length);
      const postBody = 'email=test%40example.com';
      const post = await request({ hostname: 'alight-motion-premium.site.je', path: '/index.php?action=send_eceran', method: 'POST', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Accept-Encoding': 'gzip, deflate, br', 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postBody), 'Origin': 'https://alight-motion-premium.site.je', 'Referer': 'https://alight-motion-premium.site.je/?i=1', 'Cookie': `__test=${cookie}` }, timeout: 20000 }, postBody);
      console.log('post status', post.statusCode);
      console.log('post body', post.body.slice(0, 1000));
    } catch (ex) {
      console.error('cookie error', ex.message);
    }
  } catch (err) {
    console.error('request error', err.message);
  }
})();