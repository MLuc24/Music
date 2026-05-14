# Nhac - YouTube Audio Downloader

Desktop/web app de tai va nghe nhac tu YouTube.

## Kien Truc

- **BE** (`be/`) - Node.js + Express + TypeScript
  - REST API server
  - SQLite local tai `~/Music/Nhac/music.sqlite`
  - File audio local tai `~/Music/Nhac/audio/`
  - yt-dlp + ffmpeg de download audio
- **FE** (`fe/`) - React + Vite + TypeScript
  - React Query + Zustand
- **Electron** (`electron/`) - dong goi desktop app va fork backend local.

## Yeu Cau

- Node.js 20+
- npm
- Internet de lay preview/lyrics va download tu YouTube

## Cai Dat

```bash
npm install
```

Khong can Supabase env. Backend tu tao thu muc du lieu local khi chay:

```text
~/Music/Nhac/
  music.sqlite
  audio/
  thumbnails/
```

## Development

**Terminal 1 - BE:**

```bash
cd be
npm run dev
# Server chay tai http://localhost:3101
```

**Terminal 2 - FE:**

```bash
cd fe
npm run dev
# App chay tai http://localhost:5173
```

## Production Build

```bash
npm run build:be
npm run build:fe
```

## Electron Release

Dat binary `yt-dlp` vao `electron/resources/` truoc khi build:

- Windows: `electron/resources/yt-dlp.exe`
- macOS/Linux: `electron/resources/yt-dlp`

```bash
npm run release:win
npm run release:mac
npm run release:linux
```

## API Endpoints

- `GET /api/tracks` - lay danh sach tracks
- `DELETE /api/tracks/:id` - xoa track va file audio local
- `PATCH /api/tracks/:id` - sua title/artist
- `PATCH /api/tracks/:id/favorite` - bat/tat favorite
- `POST /api/download` - download audio tu YouTube bang SSE stream
- `GET /api/player?path=...` - lay URL stream local
- `GET /api/player/stream?path=...` - stream MP3 local, ho tro HTTP Range

## Tech Stack

### Backend

- Express
- TypeScript
- SQLite (`better-sqlite3`)
- yt-dlp
- ffmpeg

### Frontend

- React 19
- Vite
- TanStack React Query v5
- Zustand v5
- TypeScript

