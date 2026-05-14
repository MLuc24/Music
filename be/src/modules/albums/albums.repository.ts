import { db } from '../../config/database.js';
import type {
  Album,
  AlbumTrack,
  AlbumTrackReorderPayload,
  AlbumWithCount,
  AlbumInsert,
  AlbumUpdate,
} from './albums.types.js';
import type { Track } from '../tracks/tracks.types.js';

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

export async function getAllAlbums(): Promise<AlbumWithCount[]> {
  const rows = db.prepare(`
    SELECT
      albums.*,
      COUNT(album_tracks.track_id) AS track_count
    FROM albums
    LEFT JOIN album_tracks ON album_tracks.album_id = albums.id
    GROUP BY albums.id
    ORDER BY albums.created_at DESC
  `).all() as AlbumWithCount[];

  return rows;
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const row = db.prepare('SELECT * FROM albums WHERE id = ?').get(id) as Album | undefined;
  return row ?? null;
}

export async function getAlbumTracks(albumId: string): Promise<Track[]> {
  const rows = db.prepare(`
    SELECT tracks.*
    FROM album_tracks
    INNER JOIN tracks ON tracks.id = album_tracks.track_id
    WHERE album_tracks.album_id = ?
    ORDER BY album_tracks.position ASC
  `).all(albumId) as TrackRow[];

  return rows.map(mapTrack);
}

export async function createAlbum(insert: AlbumInsert): Promise<Album> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  db.prepare(`
    INSERT INTO albums (id, name, description, cover_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    insert.name,
    insert.description,
    insert.cover_url,
    timestamp,
    timestamp,
  );

  const album = await getAlbumById(id);
  if (!album) throw new Error('Failed to create album');
  return album;
}

export async function updateAlbum(id: string, update: AlbumUpdate): Promise<Album> {
  const updates: string[] = [];
  const params: Record<string, string | null> = { id, updatedAt: nowIso() };

  if (update.name !== undefined) {
    updates.push('name = @name');
    params.name = update.name;
  }

  if (update.description !== undefined) {
    updates.push('description = @description');
    params.description = update.description;
  }

  if (update.cover_url !== undefined) {
    updates.push('cover_url = @coverUrl');
    params.coverUrl = update.cover_url;
  }

  if (updates.length) {
    db.prepare(`
      UPDATE albums
      SET ${updates.join(', ')}, updated_at = @updatedAt
      WHERE id = @id
    `).run(params);
  }

  const album = await getAlbumById(id);
  if (!album) throw new Error('Album not found');
  return album;
}

export async function deleteAlbum(id: string): Promise<void> {
  db.prepare('DELETE FROM albums WHERE id = ?').run(id);
}

export async function addTrackToAlbum(albumId: string, trackId: string): Promise<AlbumTrack> {
  const existing = db.prepare(`
    SELECT position
    FROM album_tracks
    WHERE album_id = ?
    ORDER BY position DESC
    LIMIT 1
  `).get(albumId) as { position: number } | undefined;

  const id = crypto.randomUUID();
  const nextPosition = existing ? existing.position + 1 : 0;
  const addedAt = nowIso();

  db.prepare(`
    INSERT INTO album_tracks (id, album_id, track_id, position, added_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, albumId, trackId, nextPosition, addedAt);

  const row = db.prepare('SELECT * FROM album_tracks WHERE id = ?').get(id) as AlbumTrack | undefined;
  if (!row) throw new Error('Failed to add track to album');
  return row;
}

export async function removeTrackFromAlbum(albumId: string, trackId: string): Promise<void> {
  db.prepare('DELETE FROM album_tracks WHERE album_id = ? AND track_id = ?').run(albumId, trackId);
}

export async function reorderAlbumTracks(
  albumId: string,
  payload: AlbumTrackReorderPayload,
): Promise<Track[]> {
  const update = db.prepare(`
    UPDATE album_tracks
    SET position = ?
    WHERE album_id = ? AND track_id = ?
  `);

  const reorder = db.transaction((trackIds: string[]) => {
    trackIds.forEach((trackId, index) => {
      update.run(index, albumId, trackId);
    });
  });

  reorder(payload.trackIds);
  return getAlbumTracks(albumId);
}

