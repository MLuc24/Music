-- ─── Favorites: add is_favorite flag to tracks ───────────────────────────────
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tracks_is_favorite ON public.tracks(is_favorite);

-- ─── Albums table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.albums (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT         NOT NULL,
  description TEXT,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on albums" ON public.albums
  FOR ALL USING (true) WITH CHECK (true);

-- ─── Album–Track junction ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.album_tracks (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id  UUID         NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  track_id  UUID         NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position  INTEGER      NOT NULL DEFAULT 0,
  added_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_album_tracks_album_id ON public.album_tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_album_tracks_track_id ON public.album_tracks(track_id);

ALTER TABLE public.album_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on album_tracks" ON public.album_tracks
  FOR ALL USING (true) WITH CHECK (true);
