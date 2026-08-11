# KOGRAPH ACTIVATOR

Web app responsif untuk aktivasi Alight Motion Premium berbasis package `amprem`.

## Fitur

- Kirim link verifikasi ke email target
- Verifikasi magic link untuk aktivasi premium
- UI responsif biru-putih dengan animasi modern
- Toast notification sebagai pengganti alert
- Support Vercel deployment

## Instalasi

```bash
npm install
```

## Menjalankan Lokal

```bash
npm start
```

Akses di `http://localhost:3000`

## Deployment Vercel

```bash
npm i -g vercel
vercel
```

Atau push ke GitHub dan import di Vercel dashboard.

## Struktur Project

```
├── api/
│   ├── send-link.js
│   └── verify-link.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── vercel.json
├── package.json
├── .gitignore
├── README.md
└── LICENSE
```

## API

- `POST /api/send-link` - Kirim verifikasi ke email
- `POST /api/verify-link` - Verifikasi magic link

## License

MIT
