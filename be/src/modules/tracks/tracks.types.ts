export interface Track {
  id: string;
  title: string;
  youtube_url: string;
  storage_path: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  artist: string | null;
  created_at: string;
  updated_at: string;
}

export type TrackInsert = Omit<Track, 'id' | 'created_at' | 'updated_at'>;
export type TrackUpdate = Partial<TrackInsert>;
