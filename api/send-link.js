const AmPrem = require('amprem');

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

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    body = {};
  }

  try {
    const { email } = body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        status: false,
        message: 'Email tidak valid atau kosong'
      });
    }

    const response = await AmPrem.sendLink(email);

    if (typeof response === 'string') {
      return res.status(400).json({
        status: false,
        message: response
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || 'Gagal mengirim link'
    });
  }
};
