const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

const BASE_URL = 'alight-motion-premium.site.je';
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

function toNumbers(hexStr) {
  return Buffer.from(hexStr, 'hex');
}

function toHex(buffer) {
  return buffer.toString('hex');
}

function extractAesParams(html) {
  const keyMatch = html.match(/a=toNumbers\("([^"]+)"\)/);
  const ivMatch = html.match(/b=toNumbers\("([^"]+)"\)/);
  const encryptedMatch = html.match(/c=toNumbers\("([^"]+)"\)/);

  if (!keyMatch || !ivMatch || !encryptedMatch) {
    throw new Error('Gagal mengekstrak parameter AES dari server');
  }

  return {
    key: keyMatch[1],
    iv: ivMatch[1],
    encrypted: encryptedMatch[1]
  };
}

function decryptAes(keyHex, ivHex, encryptedHex) {
  try {
    const key = toNumbers(keyHex);
    const iv = toNumbers(ivHex);
    const encrypted = toNumbers(encryptedHex);

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return toHex(decrypted);
  } catch (e) {
    throw new Error(`Gagal decrypt AES: ${e.message}`);
  }
}

async function getCookie() {
  const options = {
    hostname: BASE_URL,
    path: '/',
    method: 'GET',
    headers: HEADERS,
    timeout: 30000
  };

  const resp = await request(options);
  if (resp.statusCode !== 200) {
    throw new Error(`Gagal akses server: HTTP ${resp.statusCode}`);
  }

  const { key, iv, encrypted } = extractAesParams(resp.text);
  return decryptAes(key, iv, encrypted);
}

async function fetchAPI(path, cookie, method, data) {
  const postData = Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');

  const options = {
    hostname: BASE_URL,
    path: path,
    method: method || 'GET',
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

  const resp = await request(options, postData);

  if (resp.statusCode !== 200) {
    return {
      status: false,
      message: `HTTP Error: ${resp.statusCode}`,
      raw: resp.text.slice(0, 500)
    };
  }

  const text = resp.text.trim();

  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') {
      if (data.status === true || data.status === 'true') {
        return {
          status: true,
          message: data.message || 'Success',
          ...data
        };
      } else {
        return {
          status: false,
          message: data.message || 'Gagal',
          ...data
        };
      }
    }
  } catch {
    // Not JSON, continue
  }

  const lower = text.toLowerCase();
  if (lower.includes('success') || lower.includes('sent') || lower.includes('terkirim') || lower.includes('activated') || lower.includes('premium')) {
    return {
      status: true,
      message: text,
      raw: text
    };
  }

  if (lower.includes('error') || lower.includes('gagal') || lower.includes('invalid') || lower.includes('expired') || lower.includes('already')) {
    return {
      status: false,
      message: text,
      raw: text
    };
  }

  return {
    status: false,
    message: text || 'Gagal',
    raw: text
  };
}

async function sendLink(email) {
  const cookie = await getCookie();
  return await fetchAPI('/index.php?action=send_eceran', cookie, 'POST', { email });
}

async function verifyLink(email, link) {
  const cookie = await getCookie();
  return await fetchAPI('/index.php?action=verify_eceran', cookie, 'POST', { email, link });
}

function sendJSON(res, statusCode, obj) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (path === '/api/health' && method === 'GET') {
    return sendJSON(res, 200, {
      status: 'ok',
      service: 'kograph-activator',
      version: '1.0.1',
      runtime: 'node',
      endpoints: ['/api/send-link', '/api/verify-link']
    });
  }

  if (path === '/api/send-link' && method === 'POST') {
    let body = {};
    try {
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
      }
    } catch {
      body = {};
    }

    const email = (body.email || '').trim();

    console.log('[send-link] email:', JSON.stringify(email));
    console.log('[send-link] body type:', typeof req.body);

    if (!email || !email.includes('@')) {
      return sendJSON(res, 400, {
        status: false,
        message: 'Email tidak valid atau kosong'
      });
    }

    try {
      const result = await sendLink(email);
      console.log('[send-link] result:', JSON.stringify(result));
      return sendJSON(res, result.status ? 200 : 400, result);
    } catch (error) {
      console.error('[send-link] error:', error);
      return sendJSON(res, 500, {
        status: false,
        message: error.message || 'Gagal mengirim link'
      });
    }
  }

  if (path === '/api/verify-link' && method === 'POST') {
    let body = {};
    try {
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
      }
    } catch {
      body = {};
    }

    const email = (body.email || '').trim();
    const link = (body.link || '').trim();

    console.log('[verify-link] email:', JSON.stringify(email));
    console.log('[verify-link] link:', JSON.stringify(link));

    if (!email || !link) {
      return sendJSON(res, 400, {
        status: false,
        message: 'Email dan Magic Link wajib diisi'
      });
    }

    try {
      const result = await verifyLink(email, link);
      console.log('[verify-link] result:', JSON.stringify(result));
      return sendJSON(res, result.status ? 200 : 400, result);
    } catch (error) {
      console.error('[verify-link] error:', error);
      return sendJSON(res, 500, {
        status: false,
        message: error.message || 'Gagal memverifikasi link'
      });
    }
  }

  return sendJSON(res, 404, { status: false, message: 'Not found' });
};

module.exports.handler = handler;
module.exports.sendLink = sendLink;
module.exports.verifyLink = verifyLink;
module.exports.getCookie = getCookie;
