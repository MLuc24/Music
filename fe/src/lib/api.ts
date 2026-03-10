import type { Track } from '../types/database';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface DownloadProgress {
  trackId: string;
  percent: number;
  status: 'downloading' | 'processing' | 'done' | 'error';
  error?: string;
  track?: Track;
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

  async getTracks(): Promise<Track[]> {
    const response = await fetch(`${this.baseUrl}/tracks`);
    if (!response.ok) throw new Error('Failed to fetch tracks');
    return response.json();
  }

  async deleteTrack(id: string, storagePath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tracks/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    });
    if (!response.ok) throw new Error('Failed to delete track');
  }

  async getStreamUrl(storagePath: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/player/${encodeURIComponent(storagePath)}`);
    if (!response.ok) throw new Error('Failed to get stream URL');
    const data = await response.json();
    return data.url;
  }

  async getPreview(url: string): Promise<VideoPreview> {
    const response = await fetch(`${this.baseUrl}/download/preview?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to get preview');
    return response.json();
  }

  async downloadAudio(
    url: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<Track> {
    console.log('API: Sending download request to:', `${this.baseUrl}/download`);
    console.log('API: URL payload:', url);
    
    return new Promise((resolve, reject) => {
      fetch(`${this.baseUrl}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
        .then((response) => {
          console.log('API: Response status:', response.status);
          console.log('API: Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            response.text().then(text => {
              console.error('API: Error response:', text);
              try {
                const json = JSON.parse(text);
                reject(new Error(json.error || 'Download request failed'));
              } catch {
                reject(new Error(text || 'Download request failed'));
              }
            }).catch(err => {
              console.error('API: Failed to parse error response:', err);
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

          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                console.log('API: Stream ended');
                return;
              }

              const chunk = decoder.decode(value);
              console.log('API: Received chunk:', chunk);
              const lines = chunk.split('\n\n').filter(Boolean);

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    console.log('API: Progress data:', data);
                    onProgress(data);

                    if (data.status === 'done' && data.track) {
                      console.log('API: Download complete, track:', data.track);
                      resolve(data.track);
                    } else if (data.status === 'error') {
                      console.error('API: Download error:', data.error);
                      reject(new Error(data.error || 'Download failed'));
                    }
                  } catch (parseError) {
                    console.error('API: Failed to parse SSE data:', parseError, line);
                  }
                }
              }

              readStream();
            }).catch(err => {
              console.error('API: Stream read error:', err);
              reject(err);
            });
          };

          readStream();
        })
        .catch(err => {
          console.error('API: Fetch error:', err);
          reject(err);
        });
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
