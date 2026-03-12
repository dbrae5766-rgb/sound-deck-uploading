# SoundDeck Web App

A cyberpunk-styled sound management platform. Upload audio files via the web interface, manage them, and connect the desktop app to play them in real time.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel will auto-detect Next.js — just click Deploy
4. Your app will be live at `https://your-app.vercel.app`

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Upload MP3, WAV, OGG, FLAC, AAC, M4A audio files
- Browse, search, and filter sounds by category
- Play sounds directly in the browser
- Rename and delete sounds
- REST API for the desktop app

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/sounds | List all sounds |
| POST | /api/upload | Upload a sound (multipart/form-data) |
| PATCH | /api/sounds/:id | Rename or change category |
| DELETE | /api/delete/:id | Delete a sound |
| GET | /api/audio/:filename | Stream audio file |

## Note on Storage

This uses `/tmp` storage on Vercel (ephemeral). For production, integrate with:
- **Vercel Blob** (recommended) — `npm install @vercel/blob`
- **AWS S3** with presigned URLs
- **Cloudinary** audio hosting

See `lib/storage-example.ts` for how to swap in Vercel Blob.
