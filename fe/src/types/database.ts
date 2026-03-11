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

