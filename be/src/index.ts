// Public API surface for Electron main process to import from BE

// Types
export type { Track, TrackInsert, TrackUpdate } from './modules/tracks/tracks.types.js';

// Track operations
export { listTracks, addTrack, removeTrack } from './modules/tracks/tracks.service.js';

// Download
export { downloadAudio, isYouTubeUrl } from './modules/download/download.service.js';
export type { DownloadResult, DownloadProgress } from './modules/download/download.service.js';

// Storage
export { uploadAudio, deleteAudio, getSignedUrl } from './modules/storage/storage.service.js';
