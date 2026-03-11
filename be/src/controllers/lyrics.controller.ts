import type { Request, Response } from 'express';
import { fetchLyrics } from '../modules/lyrics/lyrics.service.js';

export async function getLyrics(req: Request, res: Response) {
  const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
  const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : undefined;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const data = await fetchLyrics(title, artist || undefined);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch lyrics',
    });
  }
}
