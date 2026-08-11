const AmPrem = require('amprem');

function parseBody(req) {
  try {
    if (typeof req.body === 'string') {
      const trimmed = req.body.trim();
      if (!trimmed) return {};
      return JSON.parse(trimmed);
    }
    if (req.body && typeof req.body === 'object') {
      return req.body;
    }
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8').trim();
      if (!text) return {};
      return JSON.parse(text);
    }
    return {};
  } catch {
    return {};
  }
}

async function withRetry(fn, retries = 2, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function sendJSON(res, statusCode, obj) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(obj));
}

async function handler(req, res) {
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
    const body = parseBody(req);
    const email = (body.email || '').trim();

    console.log('[send-link] email:', JSON.stringify(email));
    console.log('[send-link] body type:', typeof req.body);
    console.log('[send-link] body preview:', typeof req.body === 'string' ? req.body.slice(0, 200) : 'n/a');

    if (!email || !email.includes('@')) {
      return sendJSON(res, 400, {
        status: false,
        message: 'Email tidak valid atau kosong',
        debug: {
          email: email || '(empty)',
          bodyType: typeof req.body,
          bodyPreview: typeof req.body === 'string' ? req.body.slice(0, 200) : undefined
        }
      });
    }

    try {
      const response = await withRetry(() => AmPrem.sendLink(email));
      console.log('[send-link] amprem response type:', typeof response);

      if (typeof response === 'string') {
        return sendJSON(res, 400, {
          status: false,
          message: response
        });
      }

      return sendJSON(res, 200, response);
    } catch (error) {
      console.error('[send-link] error:', error);
      return sendJSON(res, 500, {
        status: false,
        message: error.message || 'Gagal mengirim link'
      });
    }
  }

  if (path === '/api/verify-link' && method === 'POST') {
    const body = parseBody(req);
    const email = (body.email || '').trim();
    const link = (body.link || '').trim();

    console.log('[verify-link] email:', JSON.stringify(email));
    console.log('[verify-link] link:', JSON.stringify(link));
    console.log('[verify-link] body type:', typeof req.body);

    if (!email || !link) {
      return sendJSON(res, 400, {
        status: false,
        message: 'Email dan Magic Link wajib diisi',
        debug: {
          email: email || '(empty)',
          link: link || '(empty)',
          bodyType: typeof req.body,
          bodyPreview: typeof req.body === 'string' ? req.body.slice(0, 200) : undefined
        }
      });
    }

    try {
      const response = await withRetry(() => AmPrem.verifyLink(email, link));
      console.log('[verify-link] amprem response type:', typeof response);

      if (typeof response === 'string') {
        return sendJSON(res, 400, {
          status: false,
          message: response
        });
      }

      return sendJSON(res, 200, response);
    } catch (error) {
      console.error('[verify-link] error:', error);
      return sendJSON(res, 500, {
        status: false,
        message: error.message || 'Gagal memverifikasi link'
      });
    }
  }

  return sendJSON(res, 404, { status: false, message: 'Not found' });
}

module.exports = handler;
module.exports.handler = handler;
module.exports.sendLink = async (email) => {
  const response = await AmPrem.sendLink(email);
  if (typeof response === 'string') {
    return { status: false, message: response };
  }
  return response;
};
module.exports.verifyLink = async (email, link) => {
  const response = await AmPrem.verifyLink(email, link);
  if (typeof response === 'string') {
    return { status: false, message: response };
  }
  return response;
};
module.exports.getCookie = async () => {
  const AmPremAPI = require('amprem/lib/api');
  return await AmPremAPI.getCookie();
};
