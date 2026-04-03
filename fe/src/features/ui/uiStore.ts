import { create } from 'zustand';
import type { Track } from '../../types/database';

export type ActiveView = 'home' | 'library' | 'favorites' | 'albums' | 'downloads';

interface UIState {
  activeView: ActiveView;
  selectedAlbumId: string | null;
  pendingTrackForAlbum: Track | null;
  isAddTracksOpen: boolean;
  isCommandPaletteOpen: boolean;

  setActiveView: (view: ActiveView) => void;
  setSelectedAlbumId: (id: string | null) => void;
  setPendingTrackForAlbum: (track: Track | null) => void;
  setIsAddTracksOpen: (open: boolean) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'home',
  selectedAlbumId: null,
  pendingTrackForAlbum: null,
  isAddTracksOpen: false,
  isCommandPaletteOpen: false,

  setActiveView: (activeView) => set({ activeView, selectedAlbumId: null }),
  setSelectedAlbumId: (selectedAlbumId) => set({ selectedAlbumId }),
  setPendingTrackForAlbum: (pendingTrackForAlbum) => set({ pendingTrackForAlbum }),
  setIsAddTracksOpen: (isAddTracksOpen) => set({ isAddTracksOpen }),
  setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
}));
