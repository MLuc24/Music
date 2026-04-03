import { create } from 'zustand';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { useToastStore } from '../ui/toastStore';
import { TRACKS_QUERY_KEY, LIBRARY_SUMMARY_QUERY_KEY } from '../tracks/hooks';
import type { DownloadItemState } from '../../types/database';
import { logAppError } from '../../lib/logger';

interface DownloadCenterState {
  items: DownloadItemState[];
  isRunning: boolean;
  enqueueDownload: (url: string) => void;
  retryDownload: (id: string) => void;
}

function upsertItems(
  items: DownloadItemState[],
  id: string,
  updater: (item: DownloadItemState) => DownloadItemState,
) {
  return items.map((item) => (item.id === id ? updater(item) : item));
}

async function processQueue() {
  const state = useDownloadCenterStore.getState();
  if (state.isRunning) return;

  const next = state.items.find((item) => item.status === 'queued');
  if (!next) return;

  useDownloadCenterStore.setState({ isRunning: true });

  try {
    const track = await api.downloadAudio(next.url, (progress) => {
      useDownloadCenterStore.setState((current) => ({
        items: upsertItems(current.items, next.id, (item) => ({
          ...item,
          title: progress.track?.title ?? item.title,
          thumbnailUrl: progress.track?.thumbnail_url ?? item.thumbnailUrl,
          progress: progress.percent,
          status: progress.status === 'error' ? 'error' : progress.status,
          error: progress.error ?? null,
          track: progress.track ?? item.track,
          duplicate: progress.duplicate ?? item.duplicate,
        })),
      }));
    });

    queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: LIBRARY_SUMMARY_QUERY_KEY });

    useDownloadCenterStore.setState((current) => ({
      items: upsertItems(current.items, next.id, (item) => ({
        ...item,
        title: track.title,
        thumbnailUrl: track.thumbnail_url,
        progress: 100,
        status: 'done',
        track,
      })),
      isRunning: false,
    }));

    useToastStore.getState().showToast({
      title: 'Tải nhạc thành công',
      description: track.title,
      tone: next.duplicate ? 'default' : 'success',
    });
  } catch (error) {
    logAppError('download', 'Download failed', error, { url: next.url });
    useDownloadCenterStore.setState((current) => ({
      items: upsertItems(current.items, next.id, (item) => ({
        ...item,
        status: 'error',
        error: error instanceof Error ? error.message : 'Download failed',
      })),
      isRunning: false,
    }));

    useToastStore.getState().showToast({
      title: 'Tải nhạc thất bại',
      description: error instanceof Error ? error.message : 'Download failed',
      tone: 'error',
    });
  }

  window.setTimeout(() => {
    void processQueue();
  }, 0);
}

export const useDownloadCenterStore = create<DownloadCenterState>((set) => ({
  items: [],
  isRunning: false,
  enqueueDownload: (url) => {
    const item: DownloadItemState = {
      id: crypto.randomUUID(),
      url,
      title: null,
      thumbnailUrl: null,
      progress: 0,
      status: 'queued',
      error: null,
      track: null,
      duplicate: false,
      createdAt: Date.now(),
    };

    set((state) => ({ items: [item, ...state.items] }));
    void processQueue();
  },
  retryDownload: (id) => {
    set((state) => ({
      items: upsertItems(state.items, id, (item) => ({
        ...item,
        progress: 0,
        status: 'queued',
        error: null,
        duplicate: false,
      })),
    }));
    void processQueue();
  },
}));
