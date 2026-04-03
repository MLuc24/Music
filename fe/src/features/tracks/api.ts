import { api } from '../../lib/api';
import type { LibrarySummary, Track, TrackQuery } from '../../types/database';

export const tracksApi = {
  getAll: (query?: TrackQuery): Promise<Track[]> => api.getTracks(query),
  delete: (id: string): Promise<void> => api.deleteTrack(id),
  getStreamUrl: (storagePath: string): Promise<string> =>
    api.getStreamUrl(storagePath),
  toggleFavorite: (id: string): Promise<Track> =>
    api.toggleFavorite(id),
  update: (id: string, title: string, artist: string | null): Promise<Track> =>
    api.updateTrack(id, title, artist),
  getSummary: (): Promise<LibrarySummary> => api.getLibrarySummary(),
};

