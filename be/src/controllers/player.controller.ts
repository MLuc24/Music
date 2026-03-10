import type { Request, Response } from 'express';
import { getSignedUrl } from '../modules/storage/storage.service.js';

export async function getStreamUrl(req: Request, res: Response) {
  try {
    const storagePath = Array.isArray(req.params.storagePath) 
      ? req.params.storagePath[0] 
      : req.params.storagePath;

    if (!storagePath) {
      return res.status(400).json({ error: 'storagePath is required' });
    }

    const signedUrl = await getSignedUrl(storagePath);
    res.json({ url: signedUrl });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get stream URL' 
    });
  }
}
