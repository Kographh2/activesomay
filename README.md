# KOGRAPH ACTIVATOR

Web app responsif untuk aktivasi Alight Motion Premium.

## Fitur

- Kirim link verifikasi ke email target
- Verifikasi magic link untuk aktivasi premium
- UI responsif biru-putih dengan animasi modern
- Toast notification sebagai pengganti alert
- Backend Vercel menggunakan Python

## Instalasi Lokal (Node.js)

```bash
npm install
npm start
```

Akses di `http://localhost:3000`

## Deployment Vercel (Python)

Project ini menggunakan Python runtime di Vercel untuk API endpoints.

```bash
vercel --prod
```

Atau push ke GitHub dan import di Vercel dashboard.

## Struktur Project

```
├── api/
│   ├── send_link.py        # Vercel serverless function (send)
│   ├── verify_link.py      # Vercel serverless function (verify)
│   └── health.py           # Health check endpoint
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── amprem_client.py        # Core logic: AES decryption + HTTP client
├── server.js               # Express backend untuk lokal
├── vercel.json             # Vercel routing config
├── requirements.txt        # Python dependencies
├── package.json            # Node.js dependencies (lokal)
├── .gitignore
├── README.md
└── LICENSE
```

## API

- `GET /api/health` - Health check
- `POST /api/send-link` - Kirim verifikasi ke email
- `POST /api/verify-link` - Verifikasi magic link

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Local Backend**: Express.js + amprem
- **Vercel Backend**: Python 3.9 + pycryptodome + requests

## License

MIT
