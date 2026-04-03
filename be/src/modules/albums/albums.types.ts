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

export interface AlbumTrack {
  id: string;
  album_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export type AlbumInsert = Pick<Album, 'name' | 'description' | 'cover_url'>;
export type AlbumUpdate = Partial<AlbumInsert>;

export interface AlbumTrackReorderPayload {
  trackIds: string[];
}
