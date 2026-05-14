// esbuild script: bundles BE into a single CJS file for Electron embedding.
// Run: node be/esbuild.electron.mjs
// Output: electron/dist/be-bundle.cjs

import { build } from 'esbuild';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const resourcesDir = path.join(projectRoot, 'electron', 'resources');
const resourcesNodeModulesDir = path.join(resourcesDir, 'node_modules');

await fs.mkdir(resourcesDir, { recursive: true });

const ffmpegPlatformPackage = `@ffmpeg-installer/${os.platform()}-${os.arch()}`;
const runtimePackages = [
  '@ffmpeg-installer/ffmpeg',
  ffmpegPlatformPackage,
  'yt-dlp-wrap',
  'better-sqlite3',
  'bindings',
  'file-uri-to-path',
];

for (const packageName of runtimePackages) {
  const srcDir = path.join(projectRoot, 'node_modules', ...packageName.split('/'));
  const destDir = path.join(resourcesNodeModulesDir, ...packageName.split('/'));
  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destDir), { recursive: true });
  await fs.cp(srcDir, destDir, { recursive: true });
}

await build({
  entryPoints: [path.join(__dirname, 'src', 'electron-entry.ts')],
  bundle: true,
  platform: 'node',
  // Target Node.js version shipped with Electron 34.
  target: 'node20',
  format: 'cjs',
  outfile: path.join(projectRoot, 'electron', 'dist', 'be-bundle.cjs'),

  // These packages rely on native binaries resolved at runtime; keep as external.
  external: [
    'electron',
    '@ffmpeg-installer/ffmpeg',
    'yt-dlp-wrap',
    'better-sqlite3',
  ],

  logLevel: 'info',
});

console.log('BE bundle built -> electron/dist/be-bundle.cjs');
console.log('Runtime node_modules copied -> electron/resources/node_modules');
