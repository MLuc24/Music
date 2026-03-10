import { getAllTracks, createTrack, deleteTrack } from './tracks.repository.js';
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
