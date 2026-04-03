import {
  getAllAlbums,
  getAlbumById,
  getAlbumTracks,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addTrackToAlbum,
  removeTrackFromAlbum,
  reorderAlbumTracks,
} from './albums.repository.js';
import type {
  Album,
  AlbumTrack,
  AlbumTrackReorderPayload,
  AlbumWithCount,
  AlbumInsert,
  AlbumUpdate,
} from './albums.types.js';
import type { Track } from '../tracks/tracks.types.js';

export async function listAlbums(): Promise<AlbumWithCount[]> {
  return getAllAlbums();
}

export async function getAlbum(id: string): Promise<{ album: Album; tracks: Track[] } | null> {
  const [album, tracks] = await Promise.all([
    getAlbumById(id),
    getAlbumTracks(id),
  ]);
  if (!album) return null;
  return { album, tracks };
}

export async function createNewAlbum(insert: AlbumInsert): Promise<Album> {
  if (!insert.name?.trim()) throw new Error('Album name is required');
  return createAlbum({ ...insert, name: insert.name.trim() });
}

export async function renameAlbum(id: string, update: AlbumUpdate): Promise<Album> {
  return updateAlbum(id, update);
}

export async function removeAlbum(id: string): Promise<void> {
  return deleteAlbum(id);
}

export async function appendTrackToAlbum(albumId: string, trackId: string): Promise<AlbumTrack> {
  return addTrackToAlbum(albumId, trackId);
}

export async function detachTrackFromAlbum(albumId: string, trackId: string): Promise<void> {
  return removeTrackFromAlbum(albumId, trackId);
}

export async function reorderTracksInAlbum(
  albumId: string,
  payload: AlbumTrackReorderPayload,
): Promise<Track[]> {
  if (!Array.isArray(payload.trackIds) || payload.trackIds.length === 0) {
    throw new Error('trackIds is required');
  }

  return reorderAlbumTracks(albumId, payload);
}
