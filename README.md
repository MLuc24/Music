# Nhạc - YouTube Audio Downloader

Web app để tải và nghe nhạc từ YouTube.

## Kiến trúc

- **BE** (`be/`) - Node.js + Express + TypeScript
  - REST API server
  - Supabase (PostgreSQL + Storage)
  - yt-dlp để download audio

- **FE** (`fe/`) - React + Vite + TypeScript
  - React Query + Zustand
  - Vite dev server

## Yêu cầu hệ thống

- Node.js 20+
- npm
- **yt-dlp** cài đặt trong PATH ([hướng dẫn](https://github.com/yt-dlp/yt-dlp))

## Cài đặt

```bash
# Clone repo
git clone <repo-url>
cd Nhac

# Cài dependencies (workspaces)
npm install

# Tạo .env cho BE
cp be/.env.example be/.env
# Điền SUPABASE_URL và SUPABASE_ANON_KEY vào be/.env

# Tạo .env cho FE (optional - có default)
cp fe/.env.example fe/.env
```

## Development

**Terminal 1 - BE:**
```bash
cd be
npm run dev
# Server chạy tại http://localhost:3001
```

**Terminal 2 - FE:**
```bash
cd fe
npm run dev
# App chạy tại http://localhost:5173
```

## Production Build

```bash
# Build BE
cd be
npm run build
npm start

# Build FE
cd fe
npm run build
npm run preview
```

## API Endpoints

- `GET /api/tracks` - Lấy danh sách tracks
- `DELETE /api/tracks/:id` - Xóa track
- `POST /api/download` - Download audio từ YouTube (SSE stream)
- `GET /api/player/:storagePath` - Lấy signed URL để stream

## Tech Stack

### Backend
- Express 4
- TypeScript
- Supabase JS Client
- yt-dlp (external binary)

### Frontend
- React 19
- Vite 8 beta
- TanStack React Query v5
- Zustand v5
- TypeScript

## Cấu trúc thư mục

```
.
├── be/
│   ├── src/
│   │   ├── config/          # Env & Supabase config
│   │   ├── modules/         # Business logic (tracks, download, storage)
│   │   ├── controllers/     # HTTP controllers
│   │   ├── routes/          # Express routes
│   │   └── server.ts        # Entry point
│   └── dist/                # Compiled output
├── fe/
│   ├── src/
│   │   ├── features/        # React components (downloader, player, tracks)
│   │   ├── lib/             # API client
│   │   ├── types/           # TypeScript types
│   │   └── main.tsx         # Entry point
│   └── dist/                # Build output
└── package.json             # Root workspace
```
