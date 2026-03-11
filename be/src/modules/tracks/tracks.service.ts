import { getAllTracks, createTrack, deleteTrack, toggleTrackFavorite, updateTrackFields } from './tracks.repository.js';
import { deleteAudio } from '../storage/storage.service.js';
import type { Track, TrackInsert } from './tracks.types.js';

export async function listTracks(): Promise<Track[]> {
  return getAllTracks();
}

export async function addTrack(insert: TrackInsert): Promise<Track> {
  return createTrack(insert);
}

export async function removeTrack(id: string, storagePath: string): Promise<void> {
  await deleteTrack(id);
  await deleteAudio(storagePath);
}

export async function toggleFavorite(id: string): Promise<Track> {
  return toggleTrackFavorite(id);
}

export async function updateTrackInfo(
  id: string,
  title: string,
  artist: string | null,
): Promise<Track> {
  if (!title.trim()) throw new Error('Title is required');
  return updateTrackFields(id, { title: title.trim(), artist: artist?.trim() ?? null });
}
