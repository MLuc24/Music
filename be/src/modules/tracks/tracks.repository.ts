import { supabase } from '../../config/supabase.js';
import type { LibrarySummary, Track, TrackInsert, TrackQuery, TrackSortOption } from './tracks.types.js';

function applyTrackSort(sort: TrackSortOption | undefined) {
  switch (sort) {
    case 'oldest':
      return { column: 'created_at', ascending: true };
    case 'title_asc':
      return { column: 'title', ascending: true };
    case 'title_desc':
      return { column: 'title', ascending: false };
    case 'artist_asc':
      return { column: 'artist', ascending: true };
    case 'artist_desc':
      return { column: 'artist', ascending: false };
    case 'newest':
    default:
      return { column: 'created_at', ascending: false };
  }
}

export async function getAllTracks(query: TrackQuery = {}): Promise<Track[]> {
  const {
    q,
    favorite,
    albumId,
    sort = 'newest',
    limit,
    offset = 0,
  } = query;

  if (albumId) {
    const { data, error } = await supabase
      .from('album_tracks')
      .select('position, tracks(*)')
      .eq('album_id', albumId)
      .order('position', { ascending: true });

    if (error) throw new Error(`Failed to fetch album tracks: ${error.message}`);

    let tracks = (data as unknown as { tracks: Track[] }[])
      .flatMap((row) => row.tracks)
      .filter(Boolean);

    if (typeof favorite === 'boolean') {
      tracks = tracks.filter((track) => track.is_favorite === favorite);
    }

    if (q?.trim()) {
      const normalized = q.trim().toLowerCase();
      tracks = tracks.filter((track) =>
        [track.title, track.artist, track.youtube_url]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized)),
      );
    }

    const { column, ascending } = applyTrackSort(sort);
    tracks = [...tracks].sort((left, right) => {
      if (column === 'created_at') {
        const leftValue = new Date(left.created_at).getTime();
        const rightValue = new Date(right.created_at).getTime();
        return ascending ? leftValue - rightValue : rightValue - leftValue;
      }

      const leftValue = (left[column as 'title' | 'artist'] ?? '').toLowerCase();
      const rightValue = (right[column as 'title' | 'artist'] ?? '').toLowerCase();
      const comparison = leftValue.localeCompare(rightValue, 'vi');
      return ascending ? comparison : comparison * -1;
    });

    const start = Math.max(0, offset);
    const end = typeof limit === 'number' ? start + limit : undefined;
    return tracks.slice(start, end);
  }

  let request = supabase
    .from('tracks')
    .select('*');

  if (typeof favorite === 'boolean') {
    request = request.eq('is_favorite', favorite);
  }

  if (q?.trim()) {
    const escaped = q.trim().replace(/[%_]/g, (token) => `\\${token}`);
    request = request.or(`title.ilike.%${escaped}%,artist.ilike.%${escaped}%,youtube_url.ilike.%${escaped}%`);
  }

  const { column, ascending } = applyTrackSort(sort);
  request = request.order(column, { ascending, nullsFirst: column === 'artist' });

  if (typeof limit === 'number') {
    const end = Math.max(offset, 0) + Math.max(limit - 1, 0);
    request = request.range(Math.max(offset, 0), end);
  } else if (offset > 0) {
    request = request.range(offset, offset + 999);
  }

  const { data, error } = await request;

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

export async function updateTrackFields(
  id: string,
  fields: { title?: string; artist?: string | null },
): Promise<Track> {
  const { data, error } = await supabase
    .from('tracks')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update track: ${error.message}`);
  return data as Track;
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

export async function getTrackByYoutubeUrl(youtubeUrl: string): Promise<Track | null> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('youtube_url', youtubeUrl)
    .single();

  if (error) return null;
  return data as Track;
}

export async function getLibrarySummary(): Promise<LibrarySummary> {
  const [
    { count: totalTracks, error: tracksError },
    { count: favoriteTracks, error: favoritesError },
    { count: totalAlbums, error: albumsError },
    { data: recentTracks, error: recentError },
  ] = await Promise.all([
    supabase.from('tracks').select('*', { count: 'exact', head: true }),
    supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('is_favorite', true),
    supabase.from('albums').select('*', { count: 'exact', head: true }),
    supabase.from('tracks').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  if (tracksError) throw new Error(`Failed to count tracks: ${tracksError.message}`);
  if (favoritesError) throw new Error(`Failed to count favorites: ${favoritesError.message}`);
  if (albumsError) throw new Error(`Failed to count albums: ${albumsError.message}`);
  if (recentError) throw new Error(`Failed to fetch recent tracks: ${recentError.message}`);

  return {
    totalTracks: totalTracks ?? 0,
    favoriteTracks: favoriteTracks ?? 0,
    totalAlbums: totalAlbums ?? 0,
    recentTracks: (recentTracks ?? []) as Track[],
  };
}
