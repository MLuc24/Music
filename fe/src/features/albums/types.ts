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
  tracks: import('../../types/database').Track[];
}
