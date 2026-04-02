import type { Request, Response } from 'express';
import { getSignedUrl } from '../modules/storage/storage.service.js';

export async function getStreamUrl(req: Request, res: Response) {
  try {
    const storagePathFromQuery = Array.isArray(req.query.path)
      ? req.query.path[0]
      : req.query.path;
    const storagePathFromParams = Array.isArray(req.params.storagePath)
      ? req.params.storagePath[0]
      : req.params.storagePath;
    const storagePath =
      (typeof storagePathFromQuery === 'string' ? storagePathFromQuery : null) ??
      storagePathFromParams;

    if (!storagePath) {
      return res.status(400).json({ error: 'path is required' });
    }

    const signedUrl = await getSignedUrl(storagePath);
    res.json({ url: signedUrl });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get stream URL' 
    });
  }
}
