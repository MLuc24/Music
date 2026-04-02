# Hướng dẫn đóng gói & phát hành ứng dụng Nhạc

> Dành cho **developer** muốn build/phát hành và **người dùng** muốn cài đặt ứng dụng.

---

## Mục lục

1. [Kiến trúc tổng quan](#1-kiến-trúc-tổng-quan)
2. [Yêu cầu môi trường](#2-yêu-cầu-môi-trường)
3. [Cài đặt cho lần đầu (Developer)](#3-cài-đặt-cho-lần-đầu-developer)
4. [Cấu hình bí mật (GitHub Secrets)](#4-cấu-hình-bí-mật-github-secrets)
5. [Chuẩn bị icon ứng dụng](#5-chuẩn-bị-icon-ứng-dụng)
6. [Cập nhật thông tin GitHub repo](#6-cập-nhật-thông-tin-github-repo)
7. [Build thủ công trên máy local](#7-build-thủ-công-trên-máy-local)
8. [Phát hành tự động qua GitHub Actions](#8-phát-hành-tự-động-qua-github-actions)
9. [Auto-update hoạt động như thế nào](#9-auto-update-hoạt-động-như-thế-nào)
10. [Hướng dẫn người dùng cài đặt](#10-hướng-dẫn-người-dùng-cài-đặt)
11. [Cấu trúc thư mục dự án](#11-cấu-trúc-thư-mục-dự-án)
12. [Phát triển locally (chế độ dev)](#12-phát-triển-locally-chế-độ-dev)
13. [Xử lý sự cố thường gặp](#13-xử-lý-sự-cố-thường-gặp)

---

## 1. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                   Electron Main Process                  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Express Server (be-bundle.cjs)                  │   │
│  │  • POST /api/download  → yt-dlp + ffmpeg         │   │
│  │  • GET  /api/tracks    → Supabase DB             │   │
│  │  • GET  /api/player/*  → Supabase Storage URL    │   │
│  │  • GET  /              → FE static files         │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↑                              │
│  BrowserWindow  →  http://localhost:{port}              │
│  electron-updater  →  GitHub Releases                   │
└─────────────────────────────────────────────────────────┘
          ↕ Internet
┌─────────────────────────┐
│   Supabase Cloud        │
│   • PostgreSQL (tracks, │
│     albums, playlists)  │
│   • Storage (audio MP3) │
└─────────────────────────┘
```

**Luồng hoạt động:**
1. Electron khởi động → tìm port trống bắt đầu từ `3001`
2. Fork process chạy `be-bundle.cjs` (Express server)
3. Mở `BrowserWindow` trỏ vào `http://localhost:{port}`
4. FE React được serve trực tiếp từ Express qua thư mục `be/public/`
5. Mọi request `/api/*` được xử lý bởi Express và giao tiếp với Supabase

---

## 2. Yêu cầu môi trường

### Cho Developer

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---------|---------------------|---------|
| Node.js | 22.x | Khuyến nghị dùng [nvm](https://github.com/nvm-sh/nvm) |
| npm | 10.x | Đã đi kèm với Node.js 22 |
| Git | bất kỳ | |
| Tài khoản GitHub | — | Để push tag và dùng GitHub Actions |
| Tài khoản Supabase | — | Dự án đã được tạo sẵn |

### Cho Người dùng cuối

- **Windows 10/11** (64-bit): chỉ cần tải file `.exe` và chạy
- **macOS 12+**: tải file `.dmg`, kéo vào Applications
- **Linux (Ubuntu 20.04+)**: tải file `.AppImage`, cấp quyền thực thi và chạy
- Kết nối internet để stream nhạc và download từ YouTube

---

## 3. Cài đặt cho lần đầu (Developer)

```bash
# 1. Clone repo
git clone https://github.com/<your-username>/<your-repo>.git
cd nhac

# 2. Cài đặt tất cả dependencies (bao gồm fe, be, electron)
npm install

# 3. Tạo file .env cho backend
cp be/.env.example be/.env
# Mở be/.env và điền các giá trị Supabase (xem bước 4)

# 4. Tạo file .env cho frontend (chỉ cần cho dev)
cp fe/.env.example fe/.env
```

---

## 4. Cấu hình bí mật (GitHub Secrets)

Credentials Supabase **không được commit lên git**. Chúng được inject vào binary lúc CI build.

### Lấy credentials từ Supabase

1. Đăng nhập vào [supabase.com](https://supabase.com) → chọn project của bạn
2. Vào **Settings → API**
3. Sao chép 3 giá trị sau:

| Giá trị | Tên field trên Supabase | Mô tả |
|---------|------------------------|-------|
| `SUPABASE_URL` | Project URL | VD: `https://abcxyz.supabase.co` |
| `SUPABASE_ANON_KEY` | `anon` `public` | Key công khai |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | Key bí mật — **giữ kín!** |

### Thêm vào GitHub Secrets

1. Vào GitHub repo → **Settings → Secrets and variables → Actions**
2. Nhấn **New repository secret** và thêm lần lượt:

```
SUPABASE_URL           = https://xxxxx.supabase.co
SUPABASE_ANON_KEY      = eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIs...
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` sẽ được bake vào binary. Ứng dụng này phù hợp cho **nội bộ hoặc nhóm người dùng tin cậy**.

---

## 5. Chuẩn bị icon ứng dụng

Đặt các file sau vào thư mục `electron/resources/`:

| File | Kích thước | Nền tảng |
|------|-----------|---------|
| `icon.ico` | 256×256 px (multi-size ICO) | Windows |
| `icon.icns` | 512×512 px (ICNS) | macOS |
| `icon.png` | 512×512 px (PNG) | Linux |
| `dmg-background.png` | 540×380 px (PNG, tùy chọn) | macOS — nền cửa sổ DMG |

**Tạo nhanh từ 1 file PNG duy nhất:**

```bash
# Cài công cụ
npm install -g electron-icon-maker

# Tạo tất cả format từ icon-source.png (1024x1024 px)
electron-icon-maker --input=icon-source.png --output=electron/resources
```

---

## 6. Cập nhật thông tin GitHub repo

Mở file `electron/electron-builder.yml` và cập nhật phần `publish`:

```yaml
publish:
  provider: github
  owner: your-github-username   # ← thay bằng username của bạn
  repo: your-repo-name          # ← thay bằng tên repo
  releaseType: release
```

---

## 7. Build thủ công trên máy local

> Chỉ build được cho **nền tảng hiện tại** — VD: Windows build `.exe`, macOS build `.dmg`.
> Build cross-platform thì dùng GitHub Actions (xem mục 8).

### Bước 1: Cài yt-dlp binary thủ công

Tải binary phù hợp với máy bạn từ [github.com/yt-dlp/yt-dlp/releases](https://github.com/yt-dlp/yt-dlp/releases/latest):

- **Windows**: tải `yt-dlp.exe` → đặt vào `electron/resources/yt-dlp.exe`
- **macOS**: tải `yt-dlp_macos` → đặt vào `electron/resources/yt-dlp` (không có `.exe`)
- **Linux**: tải `yt-dlp_linux` → đặt vào `electron/resources/yt-dlp`

### Bước 2: Đặt credentials vào môi trường

```bash
# Windows (PowerShell)
$env:SUPABASE_URL="https://xxxxx.supabase.co"
$env:SUPABASE_ANON_KEY="eyJhbGci..."
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# macOS/Linux
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGci..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

### Bước 3: Chạy build

```bash
# Build cho Windows (chạy trên máy Windows)
npm run release:win

# Build cho macOS (chạy trên máy Mac)
npm run release:mac

# Build cho Linux (chạy trên máy Linux)
npm run release:linux
```

Installer sẽ nằm trong thư mục `dist-electron/`.

### Các bước build được thực thi tuần tự

```
build:fe:electron  → Vite build với VITE_API_URL=/api
copy:fe            → Copy fe/dist/ → be/public/
bundle:be          → esbuild → electron/dist/be-bundle.cjs
build:electron:ts  → tsc compile electron/src/
electron-builder   → đóng gói thành installer
```

---

## 8. Phát hành tự động qua GitHub Actions

GitHub Actions sẽ **tự động build cả 3 nền tảng** (Windows, macOS, Linux) và tạo GitHub Release khi bạn push một tag `v*.*.*`.

### Quy trình phát hành

```bash
# 1. Cập nhật version trong package.json (root + electron)
# Ví dụ: từ 1.0.0 → 1.1.0

# 2. Commit thay đổi
git add .
git commit -m "chore: release v1.1.0"

# 3. Tạo và push tag
git tag v1.1.0
git push origin main --tags
```

### GitHub Actions sẽ làm gì

Sau khi bạn push tag, GitHub Actions tự động:

1. Chạy song song 3 job: `windows-latest`, `macos-latest`, `ubuntu-latest`
2. Mỗi job:
   - Tải yt-dlp binary mới nhất từ GitHub
   - Build FE (`vite build`)
   - Bundle BE (`esbuild`)
   - Compile Electron TS
   - Chạy `electron-builder --publish always`
3. Upload artifacts lên **GitHub Releases**:
   - `Nhạc-Setup-1.1.0.exe` (Windows NSIS installer)
   - `Nhạc-1.1.0.dmg` (macOS disk image)
   - `Nhạc-1.1.0.AppImage` (Linux portable)

### Xem trạng thái build

Vào GitHub repo → tab **Actions** để theo dõi tiến độ build.

---

## 9. Auto-update hoạt động như thế nào

`electron-updater` tự động kiểm tra phiên bản mới mỗi khi ứng dụng mở:

```
Ứng dụng khởi động
    ↓ (sau 3 giây)
Kiểm tra GitHub Releases API
    ↓ (nếu có bản mới)
Tải về ngầm trong nền
    ↓ (khi tải xong)
Hiện hộp thoại: "Phiên bản X.Y.Z sẵn sàng. Khởi động lại?"
    ↓ (user chọn "Khởi động lại")
Cài đặt bản mới và restart
```

**Người dùng không cần làm gì** — chỉ cần nhấn "Khởi động lại" khi được thông báo.

---

## 10. Hướng dẫn người dùng cài đặt

### Windows

1. Tải file `Nhac-Setup-x.x.x.exe` từ trang [Releases](https://github.com/<your-username>/<your-repo>/releases/latest)
2. Chạy file vừa tải — nếu Windows SmartScreen cảnh báo, nhấn **"More info" → "Run anyway"**
3. Làm theo hướng dẫn cài đặt (có thể chọn thư mục cài đặt)
4. Ứng dụng sẽ tạo shortcut trên Desktop và Start Menu
5. Mở ứng dụng qua shortcut

> Lưu ý: Ứng dụng cần kết nối internet để stream và download nhạc từ YouTube.

### macOS

1. Tải file `Nhac-x.x.x.dmg` từ trang Releases
2. Mở file `.dmg` → kéo biểu tượng **Nhạc** vào thư mục **Applications**
3. Lần đầu mở: Click chuột phải vào app → chọn **Open** (bỏ qua cảnh báo Gatekeeper)
4. Các lần sau có thể mở bình thường

### Linux (Ubuntu/Debian và các distro tương tự)

1. Tải file `Nhạc-x.x.x.AppImage` từ trang Releases
2. Mở Terminal, cấp quyền thực thi:
   ```bash
   chmod +x "Nhạc-x.x.x.AppImage"
   ```
3. Chạy ứng dụng:
   ```bash
   ./Nhạc-x.x.x.AppImage
   ```
4. Hoặc kích đúp chuột vào file trong file manager (cần cài `libfuse2` trên Ubuntu 22.04+):
   ```bash
   sudo apt install libfuse2
   ```

---

## 11. Cấu trúc thư mục dự án

```
nhac/
├── package.json              # Root workspace (fe + be + electron)
├── scripts/
│   └── copy-fe-dist.mjs      # Copy fe/dist → be/public
│
├── fe/                       # Frontend React + Vite
│   ├── src/
│   │   └── features/         # UI components theo feature
│   └── vite.config.ts        # base: './' để tương thích Electron
│
├── be/                       # Backend Express + TypeScript
│   ├── src/
│   │   ├── server.ts         # createApp() + startServer(port)
│   │   ├── electron-entry.ts # Entry point cho esbuild bundle
│   │   └── modules/
│   │       ├── tracks/
│   │       ├── albums/
│   │       ├── download/     # yt-dlp + ffmpeg
│   │       ├── lyrics/
│   │       ├── player/
│   │       └── storage/      # Supabase Storage
│   ├── esbuild.electron.mjs  # Bundle BE → be-bundle.cjs
│   └── public/               # ← FE build output (gitignored, tạo lúc build)
│
├── electron/                 # Electron wrapper
│   ├── package.json
│   ├── tsconfig.json
│   ├── electron-builder.yml  # Config đóng gói cho 3 nền tảng
│   ├── src/
│   │   ├── main.ts           # Main process
│   │   └── preload.ts        # Context bridge
│   ├── resources/            # Icon + macOS plist + yt-dlp binaries (CI)
│   └── dist/                 # ← Compiled TS + be-bundle.cjs (gitignored)
│
└── .github/
    └── workflows/
        └── release.yml       # CI: build 3 platform khi push tag
```

---

## 12. Phát triển locally (chế độ dev)

Khi phát triển, frontend và backend chạy **độc lập** — không cần Electron:

```bash
# Terminal 1: Chạy backend
npm run dev:be
# → http://localhost:3001

# Terminal 2: Chạy frontend
npm run dev:fe
# → http://localhost:5173 (proxy đến BE qua VITE_API_URL)
```

Đảm bảo `be/.env` đã được điền đầy đủ (xem mục 3).

---

## 13. Xử lý sự cố thường gặp

### ❌ Lỗi: "yt-dlp binary not found" khi download

**Nguyên nhân:** Binary yt-dlp không có ở đúng vị trí.

**Khi chạy dev:**
```bash
# Tải về và đặt vào thư mục gốc dự án
# Windows: yt-dlp.exe
# macOS/Linux: yt-dlp
```

**Khi là packaged app:** Đảm bảo binary đã được đặt vào `electron/resources/` trước khi build.

---

### ❌ Lỗi: "Missing required env variable: SUPABASE_URL"

**Nguyên nhân:** Chưa có file `be/.env` hoặc chưa set env vars.

```bash
cp be/.env.example be/.env
# Mở be/.env và điền đủ 3 giá trị SUPABASE_*
```

---

### ❌ Windows SmartScreen chặn installer

**Nguyên nhân:** App chưa có code signing certificate. Đây là cảnh báo bình thường với app chưa được ký.

**Cách bỏ qua:**
1. Nhấn "More info"
2. Nhấn "Run anyway"

Để loại bỏ cảnh báo hoàn toàn, cần mua **Code Signing Certificate** và cấu hình trong `electron-builder.yml`.

---

### ❌ macOS: "App is damaged and can't be opened"

**Nguyên nhân:** App chưa được notarize với Apple.

**Cách xử lý:**
```bash
# Gỡ quarantine attribute
xattr -cr /Applications/Nhạc.app
```

---

### ❌ Linux: AppImage không chạy được

**Ubuntu 22.04+** cần cài `libfuse2`:
```bash
sudo apt install libfuse2
```

Hoặc chạy không cần FUSE:
```bash
./Nhạc-x.x.x.AppImage --appimage-extract-and-run
```

---

### ❌ Build lỗi: "Cannot find module 'esbuild'"

```bash
npm install
# Hoặc nếu vẫn lỗi
cd be && npm install
```

---

### ❌ Port 3001 bị chiếm

Ứng dụng tự động tìm port trống bắt đầu từ 3001. Nếu gặp vấn đề:

```bash
# Kiểm tra port nào đang dùng
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001
```

---

## Tóm tắt nhanh — checklist trước khi release

- [ ] Đã cập nhật `version` trong `package.json` (root) và `electron/package.json`
- [ ] Đã thêm đủ 3 GitHub Secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Đã đặt đủ icon vào `electron/resources/` (`icon.ico`, `icon.icns`, `icon.png`)
- [ ] Đã cập nhật `owner` và `repo` trong `electron/electron-builder.yml`
- [ ] Build test local thành công: `npm run release:win` (trên Windows)
- [ ] Push tag: `git tag vX.Y.Z && git push origin main --tags`
- [ ] Kiểm tra GitHub Actions chạy thành công
- [ ] Tải thử installer từ GitHub Releases và cài đặt
