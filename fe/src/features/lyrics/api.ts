import type { LyricsData, LyricLine } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface LyricsApiResponse {
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

function parseLRC(lrc: string): LyricLine[] {
  const result: LyricLine[] = [];
  const timeTagRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const rawLine of lrc.split('\n')) {
    const textStart = rawLine.lastIndexOf(']') + 1;
    const text = rawLine.slice(textStart).trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    timeTagRegex.lastIndex = 0;
    while ((match = timeTagRegex.exec(rawLine)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const frac = match[3].padEnd(3, '0');
      const ms = parseInt(frac, 10);
      const time = minutes * 60 + seconds + ms / 1000;
      result.push({ time, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export async function getLyricsForTrack(
  title: string,
  artist?: string
): Promise<LyricsData> {
  const params = new URLSearchParams({ title });
  if (artist) params.set('artist', artist);

  const res = await fetch(`${API_BASE}/lyrics?${params}`);
  if (!res.ok) throw new Error('Failed to fetch lyrics');

  const data: LyricsApiResponse = await res.json();

  if (data.syncedLyrics) {
    const lines = parseLRC(data.syncedLyrics);
    if (lines.length > 0) {
      return { lines, plain: data.plainLyrics ?? null, isSynced: true };
    }
  }

  return { lines: [], plain: data.plainLyrics ?? null, isSynced: false };
}
