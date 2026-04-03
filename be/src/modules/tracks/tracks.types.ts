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
