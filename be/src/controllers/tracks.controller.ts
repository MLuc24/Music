import type { Request, Response } from 'express';
import { listTracks, removeTrack, toggleFavorite, updateTrackInfo } from '../modules/tracks/tracks.service.js';
import type { TrackQuery, TrackSortOption } from '../modules/tracks/tracks.types.js';

function parseTrackQuery(req: Request): TrackQuery {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const favorite = typeof req.query.favorite === 'string'
    ? req.query.favorite === 'true'
      ? true
      : req.query.favorite === 'false'
        ? false
        : undefined
    : undefined;
  const albumId = typeof req.query.albumId === 'string' ? req.query.albumId : undefined;
  const sort = typeof req.query.sort === 'string' ? req.query.sort as TrackSortOption : undefined;
  const limit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
  const offset = typeof req.query.offset === 'string' ? Number.parseInt(req.query.offset, 10) : undefined;

  return {
    q,
    favorite,
    albumId,
    sort,
    limit: Number.isFinite(limit) ? limit : undefined,
    offset: Number.isFinite(offset) ? offset : undefined,
  };
}

export async function getAllTracks(req: Request, res: Response) {
  try {
    const tracks = await listTracks(parseTrackQuery(req));
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch tracks' 
    });
  }
}

export async function deleteTrack(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await removeTrack(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete track' 
    });
  }
}

export async function patchTrackFavorite(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const track = await toggleFavorite(id);
    res.json(track);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to toggle favorite',
    });
  }
}

export async function patchTrackInfo(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, artist } = req.body as { title?: unknown; artist?: unknown };

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' });
    }

    const artistValue = typeof artist === 'string' ? artist : null;
    const track = await updateTrackInfo(id, title, artistValue);
    res.json(track);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update track',
    });
  }
}
