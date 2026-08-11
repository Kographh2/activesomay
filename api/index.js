const AmPrem = require('amprem');

function parseBody(req) {
  try {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    if (req.body && typeof req.body === 'object') {
      return req.body;
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
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      service: 'kograph-activator',
      version: '1.0.1',
      runtime: 'node',
      endpoints: ['/api/send-link', '/api/verify-link']
    }));
    return;
  }

  if (path === '/api/send-link' && method === 'POST') {
    const body = parseBody(req);
    const { email } = body;

    if (!email || !email.includes('@')) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({
        status: false,
        message: 'Email tidak valid atau kosong',
        debug: { email: email || '(empty)' }
      }));
      return;
    }

    try {
      const response = await withRetry(() => AmPrem.sendLink(email));

      if (typeof response === 'string') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({
          status: false,
          message: response
        }));
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(response));
    } catch (error) {
      console.error('send-link error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({
        status: false,
        message: error.message || 'Gagal mengirim link'
      }));
    }
    return;
  }

  if (path === '/api/verify-link' && method === 'POST') {
    const body = parseBody(req);
    const { email, link } = body;

    if (!email || !link) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({
        status: false,
        message: 'Email dan Magic Link wajib diisi',
        debug: {
          email: email || '(empty)',
          link: link || '(empty)'
        }
      }));
      return;
    }

    try {
      const response = await withRetry(() => AmPrem.verifyLink(email, link));

      if (typeof response === 'string') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({
          status: false,
          message: response
        }));
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(response));
    } catch (error) {
      console.error('verify-link error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({
        status: false,
        message: error.message || 'Gagal memverifikasi link'
      }));
    }
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 404;
  res.end(JSON.stringify({ status: false, message: 'Not found' }));
};
