import { supabase } from '../../config/supabase.js';
import type { Album, AlbumWithCount, AlbumInsert, AlbumUpdate, AlbumTrack } from './albums.types.js';
import type { Track } from '../tracks/tracks.types.js';

export async function getAllAlbums(): Promise<AlbumWithCount[]> {
  const [{ data: albums, error: albumsError }, { data: junctions, error: jError }] =
    await Promise.all([
      supabase.from('albums').select('*').order('created_at', { ascending: false }),
      supabase.from('album_tracks').select('album_id'),
    ]);

  if (albumsError) throw new Error(`Failed to fetch albums: ${albumsError.message}`);
  if (jError) throw new Error(`Failed to fetch album track counts: ${jError.message}`);

  const countMap = new Map<string, number>();
  (junctions ?? []).forEach(({ album_id }) => {
    countMap.set(album_id, (countMap.get(album_id) ?? 0) + 1);
  });

  return (albums as Album[]).map((album) => ({
    ...album,
    track_count: countMap.get(album.id) ?? 0,
  }));
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Album;
}

export async function getAlbumTracks(albumId: string): Promise<Track[]> {
  const { data, error } = await supabase
    .from('album_tracks')
    .select('tracks(*)')
    .eq('album_id', albumId)
    .order('position', { ascending: true });

  if (error) throw new Error(`Failed to fetch album tracks: ${error.message}`);
  return (data as { tracks: unknown }[]).map((row) => (row as { tracks: Track }).tracks);
}

export async function createAlbum(insert: AlbumInsert): Promise<Album> {
  const { data, error } = await supabase
    .from('albums')
    .insert(insert)
    .select()
    .single();

  if (error) throw new Error(`Failed to create album: ${error.message}`);
  return data as Album;
}

export async function updateAlbum(id: string, update: AlbumUpdate): Promise<Album> {
  const { data, error } = await supabase
    .from('albums')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update album: ${error.message}`);
  return data as Album;
}

export async function deleteAlbum(id: string): Promise<void> {
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete album: ${error.message}`);
}

export async function addTrackToAlbum(albumId: string, trackId: string): Promise<AlbumTrack> {
  const { data: existing } = await supabase
    .from('album_tracks')
    .select('position')
    .eq('album_id', albumId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing?.length ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('album_tracks')
    .insert({ album_id: albumId, track_id: trackId, position: nextPosition })
    .select()
    .single();

  if (error) throw new Error(`Failed to add track to album: ${error.message}`);
  return data as AlbumTrack;
}

export async function removeTrackFromAlbum(albumId: string, trackId: string): Promise<void> {
  const { error } = await supabase
    .from('album_tracks')
    .delete()
    .eq('album_id', albumId)
    .eq('track_id', trackId);

  if (error) throw new Error(`Failed to remove track from album: ${error.message}`);
}
