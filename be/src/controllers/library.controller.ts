import type { Request, Response } from 'express';
import { getLibrarySummary } from '../modules/tracks/tracks.service.js';

export async function getSummary(_req: Request, res: Response) {
  try {
    const summary = await getLibrarySummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch library summary',
    });
  }
}
