import { create } from 'zustand';
import type { Track } from '../../types/database';

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

  setCurrentTrack: (track: Track, streamUrl: string) => void;
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

  setCurrentTrack: (track, streamUrl) =>
    set({ currentTrack: track, streamUrl, isPlaying: true, currentTime: 0 }),
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
