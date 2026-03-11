import { create } from 'zustand';
import type { Track } from '../../types/database';

type ActiveTab = 'library' | 'albums';

interface UIState {
  activeTab: ActiveTab;
  selectedAlbumId: string | null;
  pendingTrackForAlbum: Track | null;
  isAddTracksOpen: boolean;

  setActiveTab: (tab: ActiveTab) => void;
  setSelectedAlbumId: (id: string | null) => void;
  setPendingTrackForAlbum: (track: Track | null) => void;
  setIsAddTracksOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'library',
  selectedAlbumId: null,
  pendingTrackForAlbum: null,
  isAddTracksOpen: false,

  setActiveTab: (activeTab) => set({ activeTab, selectedAlbumId: null }),
  setSelectedAlbumId: (selectedAlbumId) => set({ selectedAlbumId }),
  setPendingTrackForAlbum: (pendingTrackForAlbum) => set({ pendingTrackForAlbum }),
  setIsAddTracksOpen: (isAddTracksOpen) => set({ isAddTracksOpen }),
}));
