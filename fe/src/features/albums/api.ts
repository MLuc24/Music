import { api } from '../../lib/api';
import type { AlbumWithCount, AlbumDetail } from './types';
import type { Album } from '../../types/database';

export const albumsApi = {
  getAll: (): Promise<AlbumWithCount[]> => api.getAlbums(),
  getDetail: (id: string): Promise<AlbumDetail> => api.getAlbumDetail(id),
  create: (name: string, description?: string): Promise<Album> =>
    api.createAlbum(name, description),
  update: (id: string, name: string, description?: string): Promise<Album> =>
    api.updateAlbum(id, name, description),
  delete: (id: string): Promise<void> => api.deleteAlbum(id),
  addTrack: (albumId: string, trackId: string): Promise<void> =>
    api.addTrackToAlbum(albumId, trackId),
  removeTrack: (albumId: string, trackId: string): Promise<void> =>
    api.removeTrackFromAlbum(albumId, trackId),
  reorderTracks: (albumId: string, trackIds: string[]): Promise<AlbumDetail> =>
    api.reorderAlbumTracks(albumId, trackIds),
};
