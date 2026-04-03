// Supabase Database schema types

export interface Track {
  id: string;
  title: string;
  youtube_url: string;
  storage_path: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  artist: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type TrackInsert = Omit<Track, 'id' | 'created_at' | 'updated_at'>;
export type TrackUpdate = Partial<TrackInsert>;

export type TrackSortOption =
  | 'newest'
  | 'oldest'
  | 'title_asc'
  | 'title_desc'
  | 'artist_asc'
  | 'artist_desc';

export interface TrackQuery {
  q?: string;
  favorite?: boolean;
  albumId?: string;
  sort?: TrackSortOption;
  limit?: number;
  offset?: number;
}

export interface LibrarySummary {
  totalTracks: number;
  favoriteTracks: number;
  totalAlbums: number;
  recentTracks: Track[];
}

export interface PlayerQueueItem {
  id: string;
  track: Track;
}

export interface BulkTrackActionPayload {
  trackIds: string[];
  action: 'favorite' | 'unfavorite' | 'delete' | 'add_to_album';
  albumId?: string;
}

export type DownloadItemStatus = 'queued' | 'downloading' | 'processing' | 'done' | 'error';

export interface DownloadItemState {
  id: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  progress: number;
  status: DownloadItemStatus;
  error: string | null;
  track: Track | null;
  duplicate: boolean;
  createdAt: number;
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithCount extends Album {
  track_count: number;
}

export interface AlbumDetail {
  album: Album;
  tracks: Track[];
}

export interface Database {
  public: {
    Tables: {
      tracks: { Row: Track; Insert: TrackInsert; Update: TrackUpdate };
      albums: { Row: Album };
    };
  };
}

