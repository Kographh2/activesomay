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
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = parseBody(req);
  const { email } = body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      status: false,
      message: 'Email tidak valid atau kosong'
    });
  }

  try {
    const response = await withRetry(() => AmPrem.sendLink(email));

    if (typeof response === 'string') {
      return res.status(400).json({
        status: false,
        message: response
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('send-link error:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Gagal mengirim link'
    });
  }
};
