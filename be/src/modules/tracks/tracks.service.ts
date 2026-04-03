import {
  getAllTracks,
  createTrack,
  deleteTrack,
  getLibrarySummary as getLibrarySummaryRepository,
  getTrackById,
  getTrackByYoutubeUrl,
  toggleTrackFavorite,
  updateTrackFields,
} from './tracks.repository.js';
import { deleteAudio } from '../storage/storage.service.js';
import type { LibrarySummary, Track, TrackInsert, TrackQuery } from './tracks.types.js';

export async function listTracks(query: TrackQuery = {}): Promise<Track[]> {
  return getAllTracks(query);
}

export async function addTrack(insert: TrackInsert): Promise<Track> {
  return createTrack(insert);
}

export async function removeTrack(id: string): Promise<void> {
  const track = await getTrackById(id);
  if (!track) throw new Error('Track not found');

  await deleteAudio(track.storage_path);
  await deleteTrack(id);
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

export async function findTrackByYoutubeUrl(youtubeUrl: string): Promise<Track | null> {
  return getTrackByYoutubeUrl(youtubeUrl);
}

export async function getLibrarySummary(): Promise<LibrarySummary> {
  return getLibrarySummaryRepository();
}
