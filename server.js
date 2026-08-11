const express = require('express');
const cors = require('cors');
const path = require('path');
const AmPrem = require('amprem');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/send-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.json({
        status: false,
        message: 'Email tidak valid atau kosong'
      });
    }

    const response = await AmPrem.sendLink(email);

    if (typeof response === 'string') {
      return res.json({
        status: false,
        message: response
      });
    }

    res.json(response);
  } catch (error) {
    res.json({
      status: false,
      message: error.message || 'Gagal mengirim link'
    });
  }
});

app.post('/api/verify-link', async (req, res) => {
  try {
    const { email, link } = req.body;

    if (!email || !link) {
      return res.json({
        status: false,
        message: 'Email dan Magic Link wajib diisi'
      });
    }

    const response = await AmPrem.verifyLink(email, link);

    if (typeof response === 'string') {
      return res.json({
        status: false,
        message: response
      });
    }

    res.json(response);
  } catch (error) {
    res.json({
      status: false,
      message: error.message || 'Gagal memverifikasi link'
    });
  }
});

app.listen(PORT, () => {
  console.log(`KOGRAPH ACTIVATOR running on http://localhost:${PORT}`);
});
