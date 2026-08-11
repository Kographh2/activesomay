const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

const BASE_URL = 'activesomay.vercel.app';
const FULL_BASE = `https://${BASE_URL}`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};

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
    headers: HEADERS,
    timeout: 30000
  });

  if (resp.statusCode !== 200) {
    throw new Error(`HTTP ${resp.statusCode}`);
  }

  const { key, iv, encrypted } = extractAesParams(resp.text);
  return decryptAes(key, iv, encrypted);
}

async function sendLink(email) {
  const cookie = await getCookie();
  console.log('Cookie:', cookie.slice(0, 50) + '...');

  const postData = `email=${encodeURIComponent(email)}`;

  const options = {
    hostname: BASE_URL,
    path: '/index.php?action=send_eceran',
    method: 'POST',
    headers: {
      ...HEADERS,
      'Cookie': `__test=${cookie}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': FULL_BASE,
      'Referer': FULL_BASE + '/',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 30000
  };

  console.log('Sending POST to:', options.path);
  const resp = await request(options, postData);

  console.log('Response status:', resp.statusCode);
  console.log('Response body:', resp.text);

  return resp.text;
}

(async () => {
  try {
    const result = await sendLink('test@gmail.com');
    console.log('Final result:', result);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
