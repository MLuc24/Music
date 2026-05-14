import type { Request, Response } from 'express';
import fs from 'node:fs';
import { resolveAudioPath } from '../modules/storage/storage.service.js';

function getStoragePath(req: Request): string | undefined {
  const storagePathFromQuery = Array.isArray(req.query.path)
    ? req.query.path[0]
    : req.query.path;
  const storagePathFromParams = Array.isArray(req.params.storagePath)
    ? req.params.storagePath[0]
    : req.params.storagePath;

  return (typeof storagePathFromQuery === 'string' ? storagePathFromQuery : undefined) ?? storagePathFromParams;
}

export async function getStreamUrl(req: Request, res: Response) {
  try {
    const storagePath = getStoragePath(req);

    if (!storagePath) {
      return res.status(400).json({ error: 'path is required' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const url = `${protocol}://${host}/api/player/stream?path=${encodeURIComponent(storagePath)}`;
    res.json({ url });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get stream URL',
    });
  }
}

export function streamLocalAudio(req: Request, res: Response) {
  try {
    const storagePath = getStoragePath(req);
    if (!storagePath) {
      return res.status(400).json({ error: 'path is required' });
    }

    const audioPath = resolveAudioPath(storagePath);
    const stat = fs.statSync(audioPath);
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(audioPath).pipe(res);
      return;
    }

    const [startPart, endPart] = range.replace(/bytes=/, '').split('-');
    const start = Number.parseInt(startPart, 10);
    const end = endPart ? Number.parseInt(endPart, 10) : stat.size - 1;

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      res.end();
      return;
    }

    const clampedEnd = Math.min(end, stat.size - 1);
    const chunkSize = clampedEnd - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${clampedEnd}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mpeg',
    });

    fs.createReadStream(audioPath, { start, end: clampedEnd }).pipe(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to stream audio';
    const status = message === 'Invalid audio path' ? 400 : 404;
    res.status(status).json({ error: message });
  }
}
