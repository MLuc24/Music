// esbuild script: bundles BE into a single CJS file for Electron embedding.
// Run: node be/esbuild.electron.mjs
// Output: electron/dist/be-bundle.cjs

import dotenv from 'dotenv';
import { build } from 'esbuild';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const resourcesDir = path.join(projectRoot, 'electron', 'resources');
const runtimeConfigPath = path.join(resourcesDir, 'runtime-config.json');
const resourcesNodeModulesDir = path.join(resourcesDir, 'node_modules');

dotenv.config({ path: path.join(__dirname, '.env') });

const runtimeConfig = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

for (const [key, value] of Object.entries(runtimeConfig)) {
  if (!value) {
    throw new Error(`Missing required env variable for packaged build: ${key}`);
  }
}

await fs.mkdir(resourcesDir, { recursive: true });
await fs.writeFile(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2));

const ffmpegPlatformPackage = `@ffmpeg-installer/${os.platform()}-${os.arch()}`;
const runtimePackages = [
  '@ffmpeg-installer/ffmpeg',
  ffmpegPlatformPackage,
  'yt-dlp-wrap',
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
  // Target Node.js version shipped with Electron 34
  target: 'node22',
  format: 'cjs',
  outfile: path.join(projectRoot, 'electron', 'dist', 'be-bundle.cjs'),

  // These packages rely on native binaries resolved at runtime; keep as external.
  external: [
    'electron',
    '@ffmpeg-installer/ffmpeg',
    'yt-dlp-wrap',
  ],

  logLevel: 'info',
});

console.log('BE bundle built -> electron/dist/be-bundle.cjs');
console.log('Runtime config written -> electron/resources/runtime-config.json');
console.log('Runtime node_modules copied -> electron/resources/node_modules');
