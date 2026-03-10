// Supabase Database schema types
// Matches the `tracks` table in Supabase

export interface Track {
  id: string;
  title: string;
  youtube_url: string;
  storage_path: string;       // Path in Supabase Storage bucket
  duration_seconds: number | null;
  thumbnail_url: string | null;
  artist: string | null;
  created_at: string;
  updated_at: string;
}

export type TrackInsert = Omit<Track, 'id' | 'created_at' | 'updated_at'>;
export type TrackUpdate = Partial<TrackInsert>;

export interface Database {
  public: {
    Tables: {
      tracks: {
        Row: Track;
        Insert: TrackInsert;
        Update: TrackUpdate;
      };
    };
  };
}
