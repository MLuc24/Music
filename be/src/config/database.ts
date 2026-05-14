import Database from 'better-sqlite3';
import { databasePath, ensureLocalDataDirs } from './paths.js';

ensureLocalDataDirs();

export const db: Database.Database = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL UNIQUE,
    storage_path TEXT NOT NULL,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    artist TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_tracks_is_favorite ON tracks(is_favorite);
  CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at DESC);

  CREATE TABLE IF NOT EXISTS album_tracks (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(album_id, track_id)
  );

  CREATE INDEX IF NOT EXISTS idx_album_tracks_album_id ON album_tracks(album_id);
  CREATE INDEX IF NOT EXISTS idx_album_tracks_track_id ON album_tracks(track_id);
`);
