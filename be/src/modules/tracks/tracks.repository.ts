import { db } from '../../config/database.js';
import type { LibrarySummary, Track, TrackInsert, TrackQuery, TrackSortOption } from './tracks.types.js';

type TrackRow = Omit<Track, 'is_favorite'> & { is_favorite: 0 | 1 };

function nowIso(): string {
  return new Date().toISOString();
}

function mapTrack(row: TrackRow): Track {
  return {
    ...row,
    is_favorite: row.is_favorite === 1,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (token) => `\\${token}`);
}

function trackOrderClause(sort: TrackSortOption | undefined): string {
  switch (sort) {
    case 'oldest':
      return 'tracks.created_at ASC';
    case 'title_asc':
      return 'tracks.title COLLATE NOCASE ASC';
    case 'title_desc':
      return 'tracks.title COLLATE NOCASE DESC';
    case 'artist_asc':
      return 'tracks.artist IS NOT NULL ASC, tracks.artist COLLATE NOCASE ASC';
    case 'artist_desc':
      return 'tracks.artist IS NOT NULL ASC, tracks.artist COLLATE NOCASE DESC';
    case 'newest':
    default:
      return 'tracks.created_at DESC';
  }
}

export async function getAllTracks(query: TrackQuery = {}): Promise<Track[]> {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};
  const joins = query.albumId
    ? 'INNER JOIN album_tracks ON album_tracks.track_id = tracks.id'
    : '';

  if (query.albumId) {
    conditions.push('album_tracks.album_id = @albumId');
    params.albumId = query.albumId;
  }

  if (typeof query.favorite === 'boolean') {
    conditions.push('tracks.is_favorite = @favorite');
    params.favorite = query.favorite ? 1 : 0;
  }

  if (query.q?.trim()) {
    conditions.push(`(
      tracks.title LIKE @search ESCAPE '\\'
      OR tracks.artist LIKE @search ESCAPE '\\'
      OR tracks.youtube_url LIKE @search ESCAPE '\\'
    )`);
    params.search = `%${escapeLike(query.q.trim())}%`;
  }

  const limit = typeof query.limit === 'number' ? Math.max(0, query.limit) : undefined;
  const offset = Math.max(0, query.offset ?? 0);
  const pagination = limit !== undefined
    ? 'LIMIT @limit OFFSET @offset'
    : offset > 0
      ? 'LIMIT -1 OFFSET @offset'
      : '';

  if (limit !== undefined) params.limit = limit;
  if (pagination) params.offset = offset;

  const rows = db.prepare(`
    SELECT tracks.*
    FROM tracks
    ${joins}
    ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
    ORDER BY ${trackOrderClause(query.sort)}
    ${pagination}
  `).all(params) as TrackRow[];

  return rows.map(mapTrack);
}

export async function toggleTrackFavorite(id: string): Promise<Track> {
  const current = db.prepare('SELECT is_favorite FROM tracks WHERE id = ?').get(id) as
    | { is_favorite: 0 | 1 }
    | undefined;

  if (!current) throw new Error('Track not found');

  const updatedAt = nowIso();
  db.prepare('UPDATE tracks SET is_favorite = ?, updated_at = ? WHERE id = ?')
    .run(current.is_favorite === 1 ? 0 : 1, updatedAt, id);

  const track = await getTrackById(id);
  if (!track) throw new Error('Track not found');
  return track;
}

export async function createTrack(insert: TrackInsert): Promise<Track> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  db.prepare(`
    INSERT INTO tracks (
      id,
      title,
      youtube_url,
      storage_path,
      duration_seconds,
      thumbnail_url,
      artist,
      is_favorite,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    insert.title,
    insert.youtube_url,
    insert.storage_path,
    insert.duration_seconds,
    insert.thumbnail_url,
    insert.artist,
    insert.is_favorite ? 1 : 0,
    timestamp,
    timestamp,
  );

  const track = await getTrackById(id);
  if (!track) throw new Error('Failed to create track');
  return track;
}

export async function deleteTrack(id: string): Promise<void> {
  db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
}

export async function updateTrackFields(
  id: string,
  fields: { title?: string; artist?: string | null },
): Promise<Track> {
  const updates: string[] = [];
  const params: Record<string, string | null> = { id, updatedAt: nowIso() };

  if (fields.title !== undefined) {
    updates.push('title = @title');
    params.title = fields.title;
  }

  if (fields.artist !== undefined) {
    updates.push('artist = @artist');
    params.artist = fields.artist;
  }

  if (!updates.length) {
    const current = await getTrackById(id);
    if (!current) throw new Error('Track not found');
    return current;
  }

  db.prepare(`
    UPDATE tracks
    SET ${updates.join(', ')}, updated_at = @updatedAt
    WHERE id = @id
  `).run(params);

  const track = await getTrackById(id);
  if (!track) throw new Error('Track not found');
  return track;
}

export async function getTrackById(id: string): Promise<Track | null> {
  const row = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as TrackRow | undefined;
  return row ? mapTrack(row) : null;
}

export async function getTrackByYoutubeUrl(youtubeUrl: string): Promise<Track | null> {
  const row = db.prepare('SELECT * FROM tracks WHERE youtube_url = ?').get(youtubeUrl) as TrackRow | undefined;
  return row ? mapTrack(row) : null;
}

export async function getLibrarySummary(): Promise<LibrarySummary> {
  const totalTracks = db.prepare('SELECT COUNT(*) AS count FROM tracks').get() as { count: number };
  const favoriteTracks = db
    .prepare('SELECT COUNT(*) AS count FROM tracks WHERE is_favorite = 1')
    .get() as { count: number };
  const totalAlbums = db.prepare('SELECT COUNT(*) AS count FROM albums').get() as { count: number };
  const recentTracks = db
    .prepare('SELECT * FROM tracks ORDER BY created_at DESC LIMIT 5')
    .all() as TrackRow[];

  return {
    totalTracks: totalTracks.count,
    favoriteTracks: favoriteTracks.count,
    totalAlbums: totalAlbums.count,
    recentTracks: recentTracks.map(mapTrack),
  };
}

