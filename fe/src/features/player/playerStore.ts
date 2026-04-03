import { create } from 'zustand';
import type { PlayerQueueItem, Track } from '../../types/database';
import { createQueueItems, playResolvedTrack } from './playerPlayback';
import { logAppError } from '../../lib/logger';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  streamUrl: string | null;
  isModalOpen: boolean;
  isLooping: boolean;
  playbackRate: number;
  queue: PlayerQueueItem[];
  playHistory: string[];

  setCurrentTrack: (track: Track, streamUrl: string) => void;
  playTrack: (track: Track) => Promise<void>;
  playTracks: (tracks: Track[], startIndex?: number) => Promise<void>;
  addToQueue: (tracks: Track[], placement?: 'next' | 'end') => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  playNextFromQueue: () => Promise<void>;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  clearPlayer: () => void;
  setIsModalOpen: (open: boolean) => void;
  setIsLooping: (looping: boolean) => void;
  setPlaybackRate: (rate: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  streamUrl: null,
  isModalOpen: false,
  isLooping: false,
  playbackRate: 1,
  queue: [],
  playHistory: [],

  setCurrentTrack: (track, streamUrl) =>
    set((state) => ({
      currentTrack: track,
      streamUrl,
      isPlaying: true,
      currentTime: 0,
      playHistory: state.currentTrack ? [state.currentTrack.id, ...state.playHistory].slice(0, 30) : state.playHistory,
    })),
  playTrack: async (track) => {
    try {
      const { streamUrl } = await playResolvedTrack(track);
      set((state) => ({
        currentTrack: track,
        streamUrl,
        isPlaying: true,
        currentTime: 0,
        playHistory: state.currentTrack ? [state.currentTrack.id, ...state.playHistory].slice(0, 30) : state.playHistory,
      }));
    } catch (error) {
      logAppError('player', 'Failed to play track', error, { trackId: track.id });
      throw error;
    }
  },
  playTracks: async (tracks, startIndex = 0) => {
    const safeIndex = Math.min(Math.max(startIndex, 0), tracks.length - 1);
    const current = tracks[safeIndex];
    if (!current) return;

    const queue = createQueueItems([
      ...tracks.slice(safeIndex + 1),
      ...tracks.slice(0, safeIndex),
    ]);
    set({ queue });
    await usePlayerStore.getState().playTrack(current);
  },
  addToQueue: (tracks, placement = 'end') =>
    set((state) => {
      const items = createQueueItems(tracks).filter(
        (item) =>
          item.track.id !== state.currentTrack?.id &&
          !state.queue.some((queued) => queued.track.id === item.track.id),
      );

      return {
        queue: placement === 'next' ? [...items, ...state.queue] : [...state.queue, ...items],
      };
    }),
  removeFromQueue: (trackId) =>
    set((state) => ({ queue: state.queue.filter((item) => item.track.id !== trackId) })),
  clearQueue: () => set({ queue: [] }),
  moveQueueItem: (fromIndex, toIndex) =>
    set((state) => {
      const queue = [...state.queue];
      const [item] = queue.splice(fromIndex, 1);
      if (!item) return state;
      queue.splice(toIndex, 0, item);
      return { queue };
    }),
  playNextFromQueue: async () => {
    const nextItem = usePlayerStore.getState().queue[0];
    if (!nextItem) {
      set({ isPlaying: false });
      return;
    }

    set((state) => ({ queue: state.queue.slice(1) }));
    await usePlayerStore.getState().playTrack(nextItem.track);
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  clearPlayer: () =>
    set({ currentTrack: null, isPlaying: false, streamUrl: null, currentTime: 0, duration: 0 }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setIsLooping: (isLooping) => set({ isLooping }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
}));
