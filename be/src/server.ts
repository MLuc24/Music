import express from 'express';
import cors from 'cors';
import tracksRoutes from './routes/tracks.routes.js';
import downloadRoutes from './routes/download.routes.js';
import playerRoutes from './routes/player.routes.js';
import lyricsRoutes from './routes/lyrics.routes.js';
import albumsRoutes from './routes/albums.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tracks', tracksRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/albums', albumsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BE server running on http://localhost:${PORT}`);
});
