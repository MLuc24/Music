import { useState } from 'react';
import { api } from '../../lib/api';
import type { Track } from '../../types/database';
import type { DownloadProgress } from '../../lib/api';

export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  status: DownloadProgress['status'] | null;
  error: string | null;
}

const INITIAL_STATE: DownloadState = {
  isDownloading: false,
  progress: 0,
  status: null,
  error: null,
};

export function useYouTubeDownload(onSuccess: (track: Track) => void) {
  const [state, setState] = useState<DownloadState>(INITIAL_STATE);

  const download = async (url: string) => {
    setState({ isDownloading: true, progress: 0, status: 'downloading', error: null });

    try {
      const track = await api.downloadAudio(url, (progress) => {
        setState({
          isDownloading: progress.status !== 'done' && progress.status !== 'error',
          progress: progress.percent,
          status: progress.status,
          error: progress.error ?? null,
        });
      });
      onSuccess(track);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isDownloading: false,
        status: 'error',
        error: err instanceof Error ? err.message : 'Download failed',
      }));
    }
  };

  const reset = () => setState(INITIAL_STATE);

  return { state, download, reset };
}

