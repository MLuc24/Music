import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function resolveDataDir(): string {
  return process.env.NHAC_DATA_DIR || path.join(os.homedir(), 'Music', 'Nhac');
}

export const dataDir = resolveDataDir();
export const audioDir = path.join(dataDir, 'audio');
export const thumbnailsDir = path.join(dataDir, 'thumbnails');
export const databasePath = path.join(dataDir, 'music.sqlite');

export function ensureLocalDataDirs(): void {
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

