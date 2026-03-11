import type { Request, Response } from 'express';
import { listTracks, removeTrack, toggleFavorite, updateTrackInfo } from '../modules/tracks/tracks.service.js';

export async function getAllTracks(_req: Request, res: Response) {
  try {
    const tracks = await listTracks();
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
    const { storagePath } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: 'storagePath is required' });
    }

    await removeTrack(id, storagePath);
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
