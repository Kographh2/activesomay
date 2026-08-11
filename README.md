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
│   └── index.js           # SATU Vercel serverless function (semua endpoint)
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js              # Express backend untuk lokal
├── vercel.json            # Vercel routing config
├── package.json           # Node.js dependencies
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
- **Vercel Backend**: Node.js serverless function (single `api/index.js`)

## License

MIT
