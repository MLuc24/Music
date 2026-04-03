import { api } from '../../lib/api';
import { recordPlay } from '../tracks/useListeningHistory';
import type { PlayerQueueItem, Track } from '../../types/database';

export async function resolveTrackStreamUrl(track: Track): Promise<string> {
  return api.getStreamUrl(track.storage_path);
}

export async function playResolvedTrack(track: Track) {
  const streamUrl = await resolveTrackStreamUrl(track);
  recordPlay(track.id);
  return { track, streamUrl };
}

export function createQueueItems(tracks: Track[]): PlayerQueueItem[] {
  return tracks.map((track) => ({ id: track.id, track }));
}
