import fs from 'fs/promises';
import { supabase } from '../../config/supabase.js';

const BUCKET = 'audio';

export async function uploadAudio(trackId: string, localFilePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(localFilePath);
  const storagePath = `audio/${trackId}.mp3`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: 'audio/mpeg', upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

export async function deleteAudio(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
  return data.signedUrl;
}
