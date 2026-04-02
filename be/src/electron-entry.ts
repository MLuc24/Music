// Entry point for esbuild CJS bundle used by Electron main process.
// This file is NOT used during normal `npm run dev` — only for packaged builds.
// Electron forks this bundle as a child process with env vars pre-injected.

import './config/env.js';
import { startServer } from './server.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
startServer(port);
