import express, { type Express } from 'express';
import cors from 'cors';
import path from 'path';
import tracksRoutes from './routes/tracks.routes.js';
import downloadRoutes from './routes/download.routes.js';
import playerRoutes from './routes/player.routes.js';
import lyricsRoutes from './routes/lyrics.routes.js';
import albumsRoutes from './routes/albums.routes.js';
import libraryRoutes from './routes/library.routes.js';

function resolveStaticDir(): string {
  if (process.env.ELECTRON_STATIC_DIR) {
    return process.env.ELECTRON_STATIC_DIR;
  }

  return path.join(process.cwd(), 'public');
}

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve FE static files when bundled for Electron
  const staticDir = resolveStaticDir();
  app.use(express.static(staticDir));

  // Routes
  app.use('/api/tracks', tracksRoutes);
  app.use('/api/download', downloadRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/lyrics', lyricsRoutes);
  app.use('/api/albums', albumsRoutes);
  app.use('/api/library', libraryRoutes);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // SPA fallback: serve index.html for all non-API routes
  app.get('/{*path}', (_req, res) => {
    const indexPath = path.join(staticDir, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) res.status(404).send('Not found');
    });
  });

  return app;
}

export function startServer(port: number | string = process.env.PORT || 3001): void {
  const app = createApp();
  app.listen(port, () => {
    console.log(`🚀 BE server running on http://localhost:${port}`);
  });
}

// Auto-start when run directly (e.g. tsx watch src/server.ts or node dist/server.js)
if (/server\.(js|ts)$/i.test(process.argv[1] ?? '')) {
  startServer();
}
