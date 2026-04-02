// Copies fe/dist to the locations used by the embedded backend and packaged app.
// Run: node scripts/copy-fe-dist.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(__dirname, '..', 'fe', 'dist');
const destinations = [
  path.join(__dirname, '..', 'be', 'public'),
  path.join(__dirname, '..', 'electron', 'resources', 'public'),
];

if (!fs.existsSync(src)) {
  console.error('fe/dist not found. Run "npm run build:fe:electron" first.');
  process.exit(1);
}

for (const dest of destinations) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

console.log('Copied fe/dist -> be/public and electron/resources/public');
