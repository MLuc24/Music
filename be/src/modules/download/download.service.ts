import YTDlpWrap from 'yt-dlp-wrap';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Get the actual class from the module
const YTDlpWrapClass = (YTDlpWrap as any).default || YTDlpWrap;

// ── yt-dlp binary path resolution ──────────────────────────────────────────
// When running inside a packaged Electron app, ELECTRON_RESOURCES_PATH is set
// by electron/src/main.ts's fork() env. In that case binaries live in resources/.
// In dev mode or standalone Node, fall back to process.cwd().
function getYtDlpBinaryPath(): string {
  const binaryName = os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const resourcesPath = process.env.ELECTRON_RESOURCES_PATH;
  if (resourcesPath) {
    return path.join(resourcesPath, binaryName);
  }
  return path.join(process.cwd(), binaryName);
}

const ytDlpBinaryPath = getYtDlpBinaryPath();
const ytDlp = new YTDlpWrapClass(ytDlpBinaryPath);

// Download yt-dlp binary if not exists
let ytDlpReady = false;
async function ensureYtDlp() {
  if (ytDlpReady) return;
  
  try {
    console.log('Checking yt-dlp binary...');
    await ytDlp.getVersion();
    ytDlpReady = true;
    console.log('✅ yt-dlp binary ready');
  } catch (error) {
    console.log('📥 Downloading yt-dlp binary (this may take a moment)...');
    try {
      await YTDlpWrapClass.downloadFromGithub(ytDlpBinaryPath);
      console.log('✅ yt-dlp binary downloaded');
      ytDlpReady = true;
    } catch (downloadError) {
      console.error('Failed to download yt-dlp:', downloadError);
      throw new Error('Failed to initialize yt-dlp. Please check your internet connection.');
    }
  }
}

export interface DownloadResult {
  trackId: string;
  filePath: string;
  title: string;
  thumbnailUrl: string | null;
  artist: string | null;
}

export interface VideoPreview {
  title: string;
  thumbnailUrl: string;
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || null;
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(parsed.hostname)) {
      return parsed.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

export async function getVideoPreview(url: string): Promise<VideoPreview> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(oembedUrl);
  if (!response.ok) throw new Error('Failed to get video info');
  const data = await response.json() as { title: string };

  return {
    title: data.title,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export interface DownloadProgress {
  trackId: string;
  percent: number;
  status: 'downloading' | 'processing' | 'done' | 'error';
  error?: string;
}

export function parseTrackMetadata(rawTitle: string): { title: string; artist: string | null } {
  const normalized = rawTitle.replace(/\s+/g, ' ').trim();
  const separators = [' - ', ' – ', ' | '];

  for (const separator of separators) {
    if (!normalized.includes(separator)) continue;

    const [left, ...rest] = normalized.split(separator);
    const right = rest.join(separator).trim();
    const artist = left.trim();
    if (artist && right) {
      return {
        title: right.replace(/\((official|lyrics?|audio|video).*?\)/gi, '').trim() || right,
        artist,
      };
    }
  }

  return { title: normalized, artist: null };
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function downloadAudio(
  url: string,
  onProgress: (event: DownloadProgress) => void,
): Promise<DownloadResult> {
  const trackId = crypto.randomUUID();
  const audioDir = os.tmpdir();
  const outputPath = path.join(audioDir, `${trackId}.mp3`);

  try {
    // Ensure yt-dlp binary is available
    await ensureYtDlp();
    
    console.log('🔍 Validating YouTube URL...');
    if (!isYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }
    console.log('✅ URL valid');

    onProgress({ trackId, percent: 10, status: 'downloading' });

    console.log('📹 Getting video info...');
    const info = await ytDlp.getVideoInfo(url);
    const metadata = parseTrackMetadata(info.title || 'Unknown Title');
    const videoId = extractYouTubeVideoId(url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : (info.thumbnail || null);
    console.log('Video title:', metadata.title);
    console.log('Video duration:', info.duration, 'seconds');

    onProgress({ trackId, percent: 20, status: 'downloading' });

    console.log('🎧 Downloading audio...');
    
    // Download best audio and convert to mp3 directly with yt-dlp
    await new Promise<void>((resolve, reject) => {
      const ytDlpProcess = ytDlp.exec([
        url,
        '-f', 'bestaudio',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0', // best quality
        '--embed-thumbnail',
        '--add-metadata',
        '--convert-thumbnails', 'jpg',
        '--ffmpeg-location', path.dirname(ffmpegPath.path), // Tell yt-dlp where to find ffmpeg
        '-o', outputPath,
        '--no-playlist',
        '--no-warnings',
        '--progress',
      ]);

      let lastProgress = 20;

      ytDlpProcess.on('progress', (progress: any) => {
        console.log('Download progress:', progress);
        
        if (progress.percent) {
          const percent = 20 + (parseFloat(progress.percent) * 0.7);
          if (percent > lastProgress) {
            lastProgress = percent;
            onProgress({ trackId, percent, status: 'downloading' });
          }
        }
      });

      ytDlpProcess.on('ytDlpEvent', (eventType: string, eventData: any) => {
        console.log('yt-dlp event:', eventType, eventData);
      });

      ytDlpProcess.on('error', (error: Error) => {
        console.error('yt-dlp error:', error);
        reject(error);
      });

      ytDlpProcess.on('close', () => {
        console.log('✅ Download complete');
        resolve();
      });
    });

    onProgress({ trackId, percent: 100, status: 'done' });
    return {
      trackId,
      filePath: outputPath,
      title: metadata.title,
      thumbnailUrl,
      artist: metadata.artist,
    };

  } catch (error) {
    console.error('❌ Download failed with error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object thrown:', error);
    }
    
    // Cleanup on error
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch {}

    const errMsg = error instanceof Error ? error.message : 'Download failed';
    onProgress({ trackId, percent: 0, status: 'error', error: errMsg });
    throw new Error(errMsg);
  }
}
