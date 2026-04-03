import type {
  Album,
  AlbumDetail,
  AlbumWithCount,
  LibrarySummary,
  Track,
  TrackQuery,
} from '../types/database';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const IS_DEV = import.meta.env.DEV;
const STREAM_URL_TTL_MS = 45 * 60 * 1000;

const streamUrlCache = new Map<string, { url: string; expiresAt: number }>();

function createQueryString(query?: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export interface DownloadProgress {
  trackId: string;
  percent: number;
  status: 'downloading' | 'processing' | 'done' | 'error';
  error?: string;
  track?: Track;
  duplicate?: boolean;
}

export interface VideoPreview {
  title: string;
  thumbnailUrl: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getTracks(query?: TrackQuery): Promise<Track[]> {
    const response = await fetch(
      `${this.baseUrl}/tracks${createQueryString(query as Record<string, string | number | boolean | undefined> | undefined)}`,
    );
    if (!response.ok) throw new Error('Failed to fetch tracks');
    return response.json();
  }

  async deleteTrack(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tracks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete track');
  }

  async getStreamUrl(storagePath: string): Promise<string> {
    const cached = streamUrlCache.get(storagePath);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const response = await fetch(`${this.baseUrl}/player?path=${encodeURIComponent(storagePath)}`);
    if (!response.ok) throw new Error('Failed to get stream URL');
    const data = await response.json();
    streamUrlCache.set(storagePath, {
      url: data.url,
      expiresAt: Date.now() + STREAM_URL_TTL_MS,
    });
    return data.url;
  }

  async getPreview(url: string): Promise<VideoPreview> {
    const response = await fetch(`${this.baseUrl}/download/preview?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to get preview');
    return response.json();
  }

  async toggleFavorite(id: string): Promise<Track> {
    const response = await fetch(`${this.baseUrl}/tracks/${id}/favorite`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to toggle favorite');
    return response.json();
  }

  async updateTrack(id: string, title: string, artist: string | null): Promise<Track> {
    const response = await fetch(`${this.baseUrl}/tracks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist }),
    });
    if (!response.ok) throw new Error('Failed to update track');
    return response.json();
  }

  async getAlbums(): Promise<AlbumWithCount[]> {
    const response = await fetch(`${this.baseUrl}/albums`);
    if (!response.ok) throw new Error('Failed to fetch albums');
    return response.json();
  }

  async getLibrarySummary(): Promise<LibrarySummary> {
    const response = await fetch(`${this.baseUrl}/library/summary`);
    if (!response.ok) throw new Error('Failed to fetch library summary');
    return response.json();
  }

  async getAlbumDetail(id: string): Promise<AlbumDetail> {
    const response = await fetch(`${this.baseUrl}/albums/${id}`);
    if (!response.ok) throw new Error('Failed to fetch album');
    return response.json();
  }

  async createAlbum(name: string, description?: string): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: description ?? null, cover_url: null }),
    });
    if (!response.ok) throw new Error('Failed to create album');
    return response.json();
  }

  async updateAlbum(id: string, name: string, description?: string): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/albums/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: description ?? null }),
    });
    if (!response.ok) throw new Error('Failed to update album');
    return response.json();
  }

  async deleteAlbum(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/albums/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete album');
  }

  async addTrackToAlbum(albumId: string, trackId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/albums/${albumId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    });
    if (!response.ok) throw new Error('Failed to add track to album');
  }

  async removeTrackFromAlbum(albumId: string, trackId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/albums/${albumId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove track from album');
  }

  async reorderAlbumTracks(albumId: string, trackIds: string[]): Promise<AlbumDetail> {
    const response = await fetch(`${this.baseUrl}/albums/${albumId}/tracks/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackIds }),
    });
    if (!response.ok) throw new Error('Failed to reorder album tracks');

    const data = await response.json() as { tracks: Track[] };
    const detail = await this.getAlbumDetail(albumId);
    return { ...detail, tracks: data.tracks };
  }

  async downloadAudio(
    url: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<Track> {
    return new Promise((resolve, reject) => {
      fetch(`${this.baseUrl}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
        .then((response) => {
          if (!response.ok) {
            response.text().then(text => {
              if (IS_DEV) console.error('API: Error response:', text);
              try {
                const json = JSON.parse(text);
                reject(new Error(json.error || 'Download request failed'));
              } catch {
                reject(new Error(text || 'Download request failed'));
              }
            }).catch(err => {
              if (IS_DEV) console.error('API: Failed to parse error response:', err);
              reject(new Error('Download request failed'));
            });
            return;
          }
          
          if (!response.body) {
            reject(new Error('No response body'));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    onProgress(data);

                    if (data.status === 'done' && data.track) {
                      resolve(data.track);
                    } else if (data.status === 'error') {
                      if (IS_DEV) console.error('API: Download error:', data.error);
                      reject(new Error(data.error || 'Download failed'));
                    }
                  } catch (parseError) {
                    if (IS_DEV) console.error('API: Failed to parse SSE data:', parseError, line);
                  }
                }
              }

              readStream();
            }).catch(err => {
              if (IS_DEV) console.error('API: Stream read error:', err);
              reject(err);
            });
          };

          readStream();
        })
        .catch(err => {
          if (IS_DEV) console.error('API: Fetch error:', err);
          reject(err);
        });
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
