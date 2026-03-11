import type { Request, Response } from 'express';
import fs from 'fs';
import { downloadAudio, isYouTubeUrl, getVideoPreview } from '../modules/download/download.service.js';
import { uploadAudio } from '../modules/storage/storage.service.js';
import { addTrack } from '../modules/tracks/tracks.service.js';

export async function getYouTubePreview(req: Request, res: Response) {
  const url = req.query.url as string;
  if (!url || !isYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Valid YouTube URL is required' });
  }
  try {
    const preview = await getVideoPreview(url);
    res.json(preview);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get preview';
    res.status(500).json({ error: msg });
  }
}

export async function downloadYouTubeAudio(req: Request, res: Response) {
  const { url } = req.body;
  
  console.log('📥 Download request received:', { url });
  console.log('URL validation:', isYouTubeUrl(url));

  if (!url || !isYouTubeUrl(url)) {
    console.log('❌ Invalid URL');
    return res.status(400).json({ error: 'Valid YouTube URL is required' });
  }
  
  console.log('✅ URL valid, starting download...');

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    console.log('🎵 Starting audio download...');
    // Download audio with progress streaming
    const { trackId, filePath, title, thumbnailUrl } = await downloadAudio(url, (progress) => {
      console.log('Progress:', progress);
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });

    console.log('☁️ Uploading to storage...');
    // Upload to storage
    res.write(`data: ${JSON.stringify({ 
      trackId, 
      percent: 99, 
      status: 'processing' 
    })}\n\n`);
    
    const storagePath = await uploadAudio(trackId, filePath);
    console.log('✅ Upload complete:', storagePath);

    console.log('💾 Saving to database...');
    // Save to database
    const track = await addTrack({
      title,
      youtube_url: url,
      storage_path: storagePath,
      duration_seconds: null,
      thumbnail_url: thumbnailUrl,
      artist: null,
      is_favorite: false,
    });
    console.log('✅ Database save complete');

    // Clean up temp file
    fs.unlink(filePath, () => undefined);

    // Send final result
    res.write(`data: ${JSON.stringify({ 
      trackId, 
      percent: 100, 
      status: 'done',
      track 
    })}\n\n`);
    
    console.log('🎉 Download complete!');
    res.end();
  } catch (error) {
    console.error('❌ Download error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Download failed';
    res.write(`data: ${JSON.stringify({ 
      status: 'error', 
      error: errorMsg 
    })}\n\n`);
    res.end();
  }
}
