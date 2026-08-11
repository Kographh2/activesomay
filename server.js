const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/send-link', async (req, res) => {
  const { sendLink } = require('./api/index');
  const email = req.body?.email?.trim();

  if (!email || !email.includes('@')) {
    return res.json({
      status: false,
      message: 'Email tidak valid atau kosong'
    });
  }

  try {
    const result = await sendLink(email);
    res.status(result.status ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message || 'Gagal mengirim link'
    });
  }
});

app.post('/api/verify-link', async (req, res) => {
  const { verifyLink } = require('./api/index');
  const email = req.body?.email?.trim();
  const link = req.body?.link?.trim();

  if (!email || !link) {
    return res.json({
      status: false,
      message: 'Email dan Magic Link wajib diisi'
    });
  }

  try {
    const result = await verifyLink(email, link);
    res.status(result.status ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message || 'Gagal memverifikasi link'
    });
  }
});

app.listen(PORT, () => {
  console.log(`KOGRAPH ACTIVATOR running on http://localhost:${PORT}`);
});
