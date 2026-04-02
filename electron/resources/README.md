# electron/resources/

This directory holds platform-specific runtime assets for the packaged Electron app.

## Contents (NOT committed to git — populated by CI)

| File | Platform | Source |
|------|----------|--------|
| `yt-dlp.exe` | Windows | Downloaded from [yt-dlp GitHub Releases](https://github.com/yt-dlp/yt-dlp/releases) by CI |
| `yt-dlp` | Linux | Same source |
| `yt-dlp-macos` | macOS | Same source |

## App icons (commit these)

Place the following icon files here before building:

| File | Used for |
|------|----------|
| `icon.ico` | Windows NSIS installer |
| `icon.icns` | macOS DMG |
| `icon.png` | Linux AppImage (512×512 px recommended) |
| `dmg-background.png` | macOS DMG window background (optional, 540×380 px) |
| `entitlements.mac.plist` | macOS hardened runtime entitlements |

## Local development

For local yt-dlp: place `yt-dlp.exe` / `yt-dlp` in the **repo root** (next to `package.json`).
The backend will auto-download it if missing (requires internet on first run).
