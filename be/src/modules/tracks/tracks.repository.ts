import { supabase } from '../../config/supabase.js';
import type { Track, TrackInsert } from './tracks.types.js';

export async function getAllTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tracks: ${error.message}`);
  return data as Track[];
}

export async function toggleTrackFavorite(id: string): Promise<Track> {
  const { data: current, error: fetchError } = await supabase
    .from('tracks')
    .select('is_favorite')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Track not found: ${fetchError.message}`);

  const { data, error } = await supabase
    .from('tracks')
    .update({ is_favorite: !current.is_favorite })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to toggle favorite: ${error.message}`);
  return data as Track;
}

export async function createTrack(insert: TrackInsert): Promise<Track> {
  const { data, error } = await supabase
    .from('tracks')
    .insert(insert)
    .select()
    .single();

  if (error) throw new Error(`Failed to create track: ${error.message}`);
  return data as Track;
}

export async function deleteTrack(id: string): Promise<void> {
  const { error } = await supabase.from('tracks').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete track: ${error.message}`);
}

export async function getTrackById(id: string): Promise<Track | null> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Track;
}
