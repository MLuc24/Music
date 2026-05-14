import fs from 'node:fs/promises';
import path from 'node:path';
import { audioDir, ensureLocalDataDirs } from '../../config/paths.js';

export function resolveAudioPath(storagePath: string): string {
  const resolved = path.resolve(audioDir, storagePath);
  const relative = path.relative(audioDir, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid audio path');
  }

  return resolved;
}

export async function uploadAudio(trackId: string, localFilePath: string): Promise<string> {
  ensureLocalDataDirs();

  const storagePath = `${trackId}.mp3`;
  const destination = resolveAudioPath(storagePath);

  await fs.copyFile(localFilePath, destination);
  return storagePath;
}

export async function deleteAudio(storagePath: string): Promise<void> {
  try {
    await fs.unlink(resolveAudioPath(storagePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new Error(`Storage delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

