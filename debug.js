const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

const BASE_URL = 'activesomay.vercel.app';

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          buffer = zlib.gunzipSync(buffer);
        } else if (encoding === 'deflate') {
          buffer = zlib.inflateSync(buffer);
        } else if (encoding === 'br') {
          buffer = zlib.brotliDecompressSync(buffer);
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          text: buffer.toString('utf8')
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function extractAesParams(html) {
  const keyMatch = html.match(/a=toNumbers\("([^"]+)"\)/);
  const ivMatch = html.match(/b=toNumbers\("([^"]+)"\)/);
  const encryptedMatch = html.match(/c=toNumbers\("([^"]+)"\)/);
  if (!keyMatch || !ivMatch || !encryptedMatch) {
    throw new Error('Gagal mengekstrak parameter AES dari server');
  }
  return { key: keyMatch[1], iv: ivMatch[1], encrypted: encryptedMatch[1] };
}

function decryptAes(keyHex, ivHex, encryptedHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('hex');
}

async function getCookie() {
  const resp = await request({
    hostname: BASE_URL,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    timeout: 30000
  });

  console.log('GET / status:', resp.statusCode);
  console.log('Response length:', resp.text.length);
  console.log('Response preview:', resp.text.slice(0, 500));

  if (resp.statusCode !== 200) {
    throw new Error('HTTP ' + resp.statusCode);
  }

  const { key, iv, encrypted } = extractAesParams(resp.text);
  console.log('AES params extracted');
  return decryptAes(key, iv, encrypted);
}

(async () => {
  try {
    const cookie = await getCookie();
    console.log('Cookie:', cookie.slice(0, 50) + '...');
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
