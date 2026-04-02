import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTracks, useDeleteTrack, useToggleFavorite, useUpdateTrack } from '../tracks/hooks';
import { tracksApi } from '../tracks/api';
import { recordPlay } from './useListeningHistory';
import { usePlayerStore } from '../player/playerStore';
import { useUIStore } from '../ui/uiStore';
import type { Track } from '../../types/database';

type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'artist_asc';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  title_asc: 'Tên A→Z',
  title_desc: 'Tên Z→A',
  artist_asc: 'Nghệ sĩ A→Z',
};

function sortTracks(tracks: Track[], sort: SortOption): Track[] {
  return [...tracks].sort((a, b) => {
    switch (sort) {
      case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title_asc': return a.title.localeCompare(b.title, 'vi');
      case 'title_desc': return b.title.localeCompare(a.title, 'vi');
      case 'artist_asc': return (a.artist ?? '').localeCompare(b.artist ?? '', 'vi');
    }
  });
}

export function TrackListContainer() {
  const { data: tracks, isLoading, isError } = useTracks();
  const { mutate: deleteTrack } = useDeleteTrack();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: updateTrack } = useUpdateTrack();
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setPendingTrackForAlbum = useUIStore((state) => state.setPendingTrackForAlbum);

  const [sort, setSort] = useState<SortOption>('newest');
  const [showFavOnly, setShowFavOnly] = useState(false);

  const displayTracks = useMemo(() => {
    const base = showFavOnly ? (tracks ?? []).filter((t) => t.is_favorite) : (tracks ?? []);
    return sortTracks(base, sort);
  }, [tracks, sort, showFavOnly]);

  const handlePlay = async (track: Track) => {
    try {
      const streamUrl = await tracksApi.getStreamUrl(track.storage_path);
      setCurrentTrack(track, streamUrl);
      recordPlay(track.id);
    } catch (error) {
      console.error('Failed to play track:', track.id, track.storage_path, error);
    }
  };

  const handleRename = (track: Track, newTitle: string, newArtist: string | null) => {
    updateTrack({ id: track.id, title: newTitle, artist: newArtist });
  };

  const handleDelete = (track: Track) => {
    if (confirm(`Xóa "${track.title}"?`)) {
      deleteTrack({ id: track.id, storagePath: track.storage_path });
    }
  };

  if (isLoading) return (
    <div className="track-list__state">
      <div className="track-list__loading-spinner" />
      <p>Đang tải danh sách nhạc...</p>
    </div>
  );
  if (isError) return <p className="track-list__state track-list__state--error">Lỗi khi tải dữ liệu</p>;
  if (!tracks?.length) return <EmptyState />;

  return (
    <div className="track-list-wrapper">
      <div className="track-list__header">
        <span className="track-list__count">
          {displayTracks.length}{showFavOnly ? ' yêu thích' : ' bài hát'}
        </span>
        <div className="track-list__controls">
          <button
            className={`track-list__fav-toggle${showFavOnly ? ' track-list__fav-toggle--active' : ''}`}
            onClick={() => setShowFavOnly((v) => !v)}
            title={showFavOnly ? 'Hiển thị tất cả' : 'Chỉ yêu thích'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={showFavOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Yêu thích
          </button>
          <select
            className="track-list__sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sắp xếp"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>
      <ul className="track-list" role="list">
        {displayTracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isActive={currentTrackId === track.id}
            isPlaying={currentTrackId === track.id && isPlaying}
            onPlay={() => handlePlay(track)}
            onDelete={() => handleDelete(track)}
            onToggleFavorite={() => toggleFavorite(track.id)}
            onAddToAlbum={() => setPendingTrackForAlbum(track)}
            onRename={(title, artist) => handleRename(track, title, artist)}
          />
        ))}
      </ul>
    </div>
  );
}

// ─── Presentational sub-components ────────────────────────────────────────────

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onAddToAlbum: () => void;
  onRename: (title: string, artist: string | null) => void;
}

const TrackItem = memo(function TrackItem({
  track,
  isActive,
  isPlaying,
  onPlay,
  onDelete,
  onToggleFavorite,
  onAddToAlbum,
  onRename,
}: TrackItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(track.title);
  const [editArtist, setEditArtist] = useState(track.artist ?? '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) titleInputRef.current?.focus();
  }, [isEditing]);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(track.title);
    setEditArtist(track.artist ?? '');
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== track.title || editArtist.trim() !== (track.artist ?? '')) {
      onRename(trimmed || track.title, editArtist.trim() || null);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSave();
    if (e.key === 'Escape') setIsEditing(false);
  };
  return (
    <li className={`track-item${isActive ? ' track-item--active' : ''}`}>
      <div className="track-item__thumb-wrap" onClick={onPlay}>
        {track.thumbnail_url ? (
          <img
            className="track-item__thumb"
            src={track.thumbnail_url}
            alt={track.title}
            loading="lazy"
          />
        ) : (
          <div className="track-item__thumb track-item__thumb--placeholder">
            <span>🎵</span>
          </div>
        )}
        <div className="track-item__thumb-overlay">
          {isPlaying ? (
            <span className="track-item__playing-bars">
              <span /><span /><span />
            </span>
          ) : (
            <span className="track-item__play-icon">▶</span>
          )}
        </div>
      </div>

      <div className="track-item__info">
        {isEditing ? (
          <div className="track-item__edit-fields">
            <input
              ref={titleInputRef}
              className="track-item__edit-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditSave}
              placeholder="Tên bài hát"
              maxLength={200}
              onClick={(e) => e.stopPropagation()}
            />
            <input
              className="track-item__edit-input track-item__edit-input--artist"
              value={editArtist}
              onChange={(e) => setEditArtist(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditSave}
              placeholder="Nghệ sĩ (tùy chọn)"
              maxLength={100}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <>
            <div className="track-item__title-row">
              <p className="track-item__title">{track.title}</p>
              <button
                className="track-item__edit-btn"
                onClick={handleEditStart}
                aria-label="Đổi tên bài hát"
                title="Đổi tên (nhấn đúp tên)"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            {track.artist && <p className="track-item__artist">{track.artist}</p>}
          </>
        )}
      </div>

      <div className="track-item__actions">
        <button
          className={`track-item__fav-btn${track.is_favorite ? ' track-item__fav-btn--active' : ''}`}
          onClick={onToggleFavorite}
          aria-label={track.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          title={track.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={track.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <button
          className="track-item__album-btn"
          onClick={onAddToAlbum}
          aria-label="Thêm vào album"
          title="Thêm vào album"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
            <line x1="18" y1="13" x2="18" y2="7" />
            <line x1="15" y1="7" x2="21" y2="7" />
          </svg>
        </button>
        <button
          className="track-item__delete"
          onClick={onDelete}
          aria-label={`Xóa ${track.title}`}
          title="Xóa bài hát"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </li>
  );
});

function EmptyState() {
  return (
    <div className="track-list__empty">
      <div className="track-list__empty-icon">🎵</div>
      <p className="track-list__empty-title">Thư viện trống</p>
      <p className="track-list__empty-sub">Dán link YouTube ở trên để tải nhạc về</p>
    </div>
  );
}

