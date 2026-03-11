export interface LyricsResult {
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

interface LrclibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

const LRCLIB_BASE = 'https://lrclib.net/api';

export async function fetchLyrics(title: string, artist?: string): Promise<LyricsResult> {
  // Try exact match first
  const result = await tryExactMatch(title, artist);
  if (result) return result;

  // Fall back to search
  const query = artist ? `${title} ${artist}` : title;
  return trySearch(query);
}

async function tryExactMatch(title: string, artist?: string): Promise<LyricsResult | null> {
  const params = new URLSearchParams({ track_name: title });
  if (artist) params.set('artist_name', artist);

  try {
    const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      headers: { 'Lrclib-Client': 'NhacApp/1.0' },
    });
    if (!res.ok) return null;

    const data: LrclibTrack = await res.json();
    if (!data.syncedLyrics && !data.plainLyrics) return null;

    return {
      syncedLyrics: data.syncedLyrics ?? null,
      plainLyrics: data.plainLyrics ?? null,
    };
  } catch {
    return null;
  }
}

async function trySearch(query: string): Promise<LyricsResult> {
  try {
    const res = await fetch(
      `${LRCLIB_BASE}/search?q=${encodeURIComponent(query)}`,
      { headers: { 'Lrclib-Client': 'NhacApp/1.0' } }
    );
    if (!res.ok) return { syncedLyrics: null, plainLyrics: null };

    const results: LrclibTrack[] = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
      return { syncedLyrics: null, plainLyrics: null };
    }

    // Prefer tracks that have synced lyrics
    const best = results.find((r) => r.syncedLyrics) ?? results[0];
    return {
      syncedLyrics: best.syncedLyrics ?? null,
      plainLyrics: best.plainLyrics ?? null,
    };
  } catch {
    return { syncedLyrics: null, plainLyrics: null };
  }
}
