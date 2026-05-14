# Huong Dan Dong Goi Va Phat Hanh Ung Dung Nhac

Ung dung hien luu toan bo thu vien nhac tren may local bang SQLite va file MP3. Khong can Supabase, khong can runtime config chua secret.

## Kien Truc Runtime

- Electron main process tim port trong va fork backend bundle `be-bundle.cjs`.
- Backend Express phuc vu FE static files va cac route `/api/*`.
- Metadata nam trong `~/Music/Nhac/music.sqlite`.
- Audio nam trong `~/Music/Nhac/audio/*.mp3`.
- Lyrics, YouTube preview va download van can internet.

## Yeu Cau Moi Truong

- Node.js 20+ va npm.
- Git.
- `yt-dlp` binary dat trong `electron/resources/` truoc khi release.
- Tai khoan GitHub neu can GitHub Releases/auto-update.

## Cai Dat Lan Dau

```bash
npm install
```

Khong tao `be/.env` cho Supabase nua. Backend tu tao thu muc local:

```text
~/Music/Nhac/
  music.sqlite
  audio/
  thumbnails/
```

## Build Thu Cong

Dat binary yt-dlp:

- Windows: `electron/resources/yt-dlp.exe`
- macOS/Linux: `electron/resources/yt-dlp`

Chay build theo nen tang:

```bash
npm run release:win
npm run release:mac
npm run release:linux
```

Installer/output nam trong `dist-electron/`.

## GitHub Actions Va Secrets

Khong can GitHub Secrets cho Supabase. Neu workflow release can credential rieng cho signing hoac publish thi cau hinh theo workflow do.

## Auto Update

`electron-updater` doc release moi tu GitHub Releases theo `owner` va `repo` trong `electron/electron-builder.yml`. Khi update app, du lieu local trong `~/Music/Nhac/` duoc giu nguyen.

## Phat Trien Local

Backend:

```bash
npm run dev:be
```

Frontend:

```bash
npm run dev:fe
```

Build rieng:

```bash
npm run build:be
npm run build:fe
```

## Xu Ly Su Co

### App khong phat duoc nhac

- Kiem tra file co ton tai trong `~/Music/Nhac/audio/`.
- Kiem tra API `GET /api/player?path=<file>.mp3` tra ve URL stream.
- Kiem tra `GET /api/player/stream?path=<file>.mp3` tra ve `200` hoac `206`.

### Download that bai

- Kiem tra internet.
- Kiem tra `yt-dlp` binary co trong `electron/resources/`.
- Chay lai build neu vua thay binary.

### Windows SmartScreen chan installer

App chua code signing certificate co the bi canh bao. Nguoi dung co the chon More info -> Run anyway, hoac them code signing trong pipeline release.

## Checklist Truoc Khi Release

- [ ] Cap nhat version trong `package.json` va `electron/package.json`.
- [ ] Dat dung `yt-dlp` binary vao `electron/resources/`.
- [ ] Dat icon vao `electron/resources/` neu build nen tang can icon.
- [ ] Kiem tra `owner` va `repo` trong `electron/electron-builder.yml`.
- [ ] Chay `npm run build:be`.
- [ ] Chay `npm run build:fe`.
- [ ] Chay release command tren nen tang can build.
- [ ] Cai thu installer va xac nhan du lieu tao trong `~/Music/Nhac/`.

