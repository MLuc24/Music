import { api } from '../../lib/api';
import type { Track } from '../../types/database';

export const tracksApi = {
  getAll: (): Promise<Track[]> => api.getTracks(),
  delete: (id: string, storagePath: string): Promise<void> =>
    api.deleteTrack(id, storagePath),
  getStreamUrl: (storagePath: string): Promise<string> =>
    api.getStreamUrl(storagePath),
  toggleFavorite: (id: string): Promise<Track> =>
    api.toggleFavorite(id),
  update: (id: string, title: string, artist: string | null): Promise<Track> =>
    api.updateTrack(id, title, artist),
};

