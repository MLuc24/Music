import type { Request, Response } from 'express';
import {
  listAlbums,
  getAlbum,
  createNewAlbum,
  renameAlbum,
  removeAlbum,
  appendTrackToAlbum,
  detachTrackFromAlbum,
  reorderTracksInAlbum,
} from '../modules/albums/albums.service.js';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

export async function getAlbums(_req: Request, res: Response) {
  try {
    const albums = await listAlbums();
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch albums' });
  }
}

export async function getAlbumDetail(req: Request, res: Response) {
  try {
    const result = await getAlbum(param(req.params.id));
    if (!result) return res.status(404).json({ error: 'Album not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch album' });
  }
}

export async function postAlbum(req: Request, res: Response) {
  try {
    const album = await createNewAlbum(req.body);
    res.status(201).json(album);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create album';
    res.status(msg.includes('required') ? 400 : 500).json({ error: msg });
  }
}

export async function patchAlbum(req: Request, res: Response) {
  try {
    const album = await renameAlbum(param(req.params.id), req.body);
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update album' });
  }
}

export async function deleteAlbum(req: Request, res: Response) {
  try {
    await removeAlbum(param(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete album' });
  }
}

export async function postAlbumTrack(req: Request, res: Response) {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ error: 'trackId is required' });
    const albumTrack = await appendTrackToAlbum(param(req.params.id), trackId);
    res.status(201).json(albumTrack);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add track' });
  }
}

export async function deleteAlbumTrack(req: Request, res: Response) {
  try {
    await detachTrackFromAlbum(param(req.params.id), param(req.params.trackId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove track' });
  }
}

export async function patchAlbumTrackOrder(req: Request, res: Response) {
  try {
    const trackIds = Array.isArray(req.body?.trackIds) ? req.body.trackIds : null;
    if (!trackIds) return res.status(400).json({ error: 'trackIds is required' });

    const tracks = await reorderTracksInAlbum(param(req.params.id), { trackIds });
    res.json({ tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder tracks';
    res.status(message.includes('required') ? 400 : 500).json({ error: message });
  }
}
