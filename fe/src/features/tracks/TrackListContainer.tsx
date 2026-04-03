import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTracks, useDeleteTrack, useToggleFavorite, useUpdateTrack, TRACKS_QUERY_KEY, LIBRARY_SUMMARY_QUERY_KEY } from '../tracks/hooks';
import { tracksApi } from '../tracks/api';
import { albumsApi } from '../albums/api';
import { useAlbums } from '../albums/hooks';
import { usePlayerStore } from '../player/playerStore';
import { useUIStore } from '../ui/uiStore';
import { useToastStore } from '../ui/toastStore';
import { logAppError } from '../../lib/logger';
import type { Track, TrackSortOption } from '../../types/database';

const SORT_LABELS: Record<TrackSortOption, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  title_asc: 'Tên A-Z',
  title_desc: 'Tên Z-A',
  artist_asc: 'Nghệ sĩ A-Z',
  artist_desc: 'Nghệ sĩ Z-A',
};

const TRACK_ROW_ESTIMATE = 88;
const TRACK_ROW_GAP = 8;
const TRACK_OVERSCAN = 8;
const DELETE_DELAY_MS = 4000;

interface TrackListContainerProps {
  favoriteOnly?: boolean;
  title?: string;
}

export function TrackListContainer({ favoriteOnly = false, title }: TrackListContainerProps) {
  const queryClient = useQueryClient();
  const deleteTrackMutation = useDeleteTrack();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: updateTrack } = useUpdateTrack();
  const { data: albums } = useAlbums();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setPendingTrackForAlbum = useUIStore((state) => state.setPendingTrackForAlbum);
  const showToast = useToastStore((state) => state.showToast);

  const [sort, setSort] = useState<TrackSortOption>('newest');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [bulkAlbumOpen, setBulkAlbumOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [rowHeight, setRowHeight] = useState(TRACK_ROW_ESTIMATE);
  const listRef = useRef<HTMLUListElement | null>(null);
  const deleteTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data: tracks, isLoading, isError } = useTracks({
    q: debouncedSearch || undefined,
    favorite: favoriteOnly ? true : undefined,
    sort,
  });

  const displayTracks = useMemo(
    () => (tracks ?? []).filter((track) => !pendingDeleteIds.includes(track.id)),
    [tracks, pendingDeleteIds],
  );

  const shouldVirtualize = displayTracks.length > 60 && viewportHeight > 0;
  const visibleCount = shouldVirtualize
    ? Math.ceil(viewportHeight / rowHeight) + TRACK_OVERSCAN * 2
    : displayTracks.length;
  const startIndex = shouldVirtualize
    ? Math.max(0, Math.floor(scrollTop / rowHeight) - TRACK_OVERSCAN)
    : 0;
  const endIndex = shouldVirtualize
    ? Math.min(displayTracks.length, startIndex + visibleCount)
    : displayTracks.length;
  const visibleTracks = shouldVirtualize ? displayTracks.slice(startIndex, endIndex) : displayTracks;
  const paddingTop = shouldVirtualize ? startIndex * rowHeight : 0;
  const paddingBottom = shouldVirtualize
    ? Math.max(0, (displayTracks.length - endIndex) * rowHeight)
    : 0;

  const selectedTracks = useMemo(
    () => displayTracks.filter((track) => selectedIds.includes(track.id)),
    [displayTracks, selectedIds],
  );

  const measureTrackRow = useCallback((node: HTMLLIElement | null) => {
    if (!node) return;

    const nextRowHeight = node.getBoundingClientRect().height + TRACK_ROW_GAP;
    if (Math.abs(nextRowHeight - rowHeight) > 1) {
      setRowHeight(nextRowHeight);
    }
  }, [rowHeight]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateViewportHeight = () => {
      setViewportHeight(list.clientHeight);
    };

    updateViewportHeight();

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(list);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    let frameId = 0;

    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setScrollTop(list.scrollTop);
      });
    };

    handleScroll();
    list.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      list.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = 0;
  }, [sort, debouncedSearch, favoriteOnly]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => displayTracks.some((track) => track.id === id)));
  }, [displayTracks]);

  useEffect(() => () => {
    deleteTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    deleteTimersRef.current.clear();
  }, []);

  const invalidateTrackData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: LIBRARY_SUMMARY_QUERY_KEY });
  }, [queryClient]);

  const handlePlay = async (track: Track) => {
    try {
      await playTrack(track);
    } catch (error) {
      logAppError('library', 'Failed to play track', error, { trackId: track.id });
      showToast({
        title: 'Không thể phát bài hát',
        description: track.title,
        tone: 'error',
      });
    }
  };

  const handleRename = (track: Track, newTitle: string, newArtist: string | null) => {
    updateTrack({ id: track.id, title: newTitle, artist: newArtist });
  };

  const commitDelete = useCallback(async (trackIds: string[]) => {
    try {
      await Promise.all(trackIds.map((trackId) => deleteTrackMutation.mutateAsync(trackId)));
      invalidateTrackData();
    } catch (error) {
      logAppError('library', 'Failed to delete track', error, { trackIds });
      showToast({
        title: 'Xóa bài hát thất bại',
        description: 'Một số bài hát chưa được xóa.',
        tone: 'error',
      });
    } finally {
      setPendingDeleteIds((current) => current.filter((id) => !trackIds.includes(id)));
      setSelectedIds((current) => current.filter((id) => !trackIds.includes(id)));
      trackIds.forEach((trackId) => deleteTimersRef.current.delete(trackId));
    }
  }, [deleteTrackMutation, invalidateTrackData, showToast]);

  const scheduleDelete = (tracksToDelete: Track[]) => {
    const ids = tracksToDelete.map((track) => track.id);
    setPendingDeleteIds((current) => [...new Set([...current, ...ids])]);

    const timerId = window.setTimeout(() => {
      void commitDelete(ids);
    }, DELETE_DELAY_MS);

    ids.forEach((id) => deleteTimersRef.current.set(id, timerId));

    showToast({
      title: ids.length > 1 ? `Đã lên lịch xóa ${ids.length} bài hát` : 'Đã lên lịch xóa bài hát',
      description: 'Bạn có 4 giây để hoàn tác.',
      actionLabel: 'Hoàn tác',
      onAction: () => {
        window.clearTimeout(timerId);
        ids.forEach((id) => deleteTimersRef.current.delete(id));
        setPendingDeleteIds((current) => current.filter((id) => !ids.includes(id)));
      },
    });
  };

  const handleBulkFavorite = async (favorite: boolean) => {
    const targets = selectedTracks.filter((track) => track.is_favorite !== favorite);
    await Promise.all(targets.map((track) => tracksApi.toggleFavorite(track.id)));
    invalidateTrackData();
    setSelectedIds([]);
    showToast({
      title: favorite ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích',
      description: `${targets.length} bài hát đã được cập nhật.`,
      tone: 'success',
    });
  };

  const handleBulkAddToAlbum = async (albumId: string) => {
    await Promise.all(selectedTracks.map((track) => albumsApi.addTrack(albumId, track.id)));
    setBulkAlbumOpen(false);
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ['albums'] });
    showToast({
      title: 'Đã thêm vào album',
      description: `${selectedTracks.length} bài hát đã được thêm.`,
      tone: 'success',
    });
  };

  if (isLoading) {
    return (
      <div className="track-list__state">
        <div className="track-list__loading-spinner" />
        <p>Đang tải danh sách nhạc...</p>
      </div>
    );
  }

  if (isError) {
    return <p className="track-list__state track-list__state--error">Lỗi khi tải dữ liệu.</p>;
  }

  return (
    <div className="track-list-wrapper">
      <div className="track-list__header track-list__header--dense">
        <div className="track-list__headline">
          <span className="track-list__count">{title ?? (favoriteOnly ? 'Yêu thích' : 'Thư viện')}</span>
          <span className="track-list__meta">{displayTracks.length} bài hát</span>
        </div>

        <div className="track-list__controls track-list__controls--wide">
          <input
            className="track-list__search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên bài, nghệ sĩ hoặc URL..."
            aria-label="Tìm kiếm bài hát"
          />

          <select
            className="track-list__sort-select"
            value={sort}
            onChange={(event) => setSort(event.target.value as TrackSortOption)}
            aria-label="Sắp xếp bài hát"
          >
            {(Object.keys(SORT_LABELS) as TrackSortOption[]).map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>

          <button
            className="track-list__secondary-btn"
            onClick={() => setSelectedIds(displayTracks.map((track) => track.id))}
            disabled={displayTracks.length === 0}
          >
            Chọn tất cả
          </button>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="track-list__bulk-bar">
          <span>{selectedIds.length} mục đã chọn</span>
          <div className="track-list__bulk-actions">
            <button onClick={() => void handleBulkFavorite(true)}>Yêu thích</button>
            <button onClick={() => void handleBulkFavorite(false)}>Bỏ thích</button>
            <button onClick={() => setBulkAlbumOpen(true)}>Thêm vào album</button>
            <button className="track-list__danger-btn" onClick={() => scheduleDelete(selectedTracks)}>Xóa</button>
            <button onClick={() => setSelectedIds([])}>Bỏ chọn</button>
          </div>
        </div>
      ) : null}

      {!displayTracks.length ? (
        <EmptyState search={debouncedSearch} favoriteOnly={favoriteOnly} />
      ) : (
        <ul
          ref={listRef}
          className={`track-list${shouldVirtualize ? ' track-list--virtualized' : ''}`}
          role="list"
          style={{
            paddingTop: shouldVirtualize ? 12 + paddingTop : 12,
            paddingBottom: shouldVirtualize ? 12 + paddingBottom : 12,
          }}
        >
          {visibleTracks.map((track, index) => {
            const absoluteIndex = startIndex + index;

            return (
              <TrackItem
                key={track.id}
                track={track}
                isActive={currentTrackId === track.id}
                isPlaying={currentTrackId === track.id && isPlaying}
                isSelected={selectedIds.includes(track.id)}
                onSelect={(checked) =>
                  setSelectedIds((current) =>
                    checked
                      ? [...new Set([...current, track.id])]
                      : current.filter((id) => id !== track.id),
                  )
                }
                onPlay={() => void handlePlay(track)}
                onDelete={() => scheduleDelete([track])}
                onToggleFavorite={() => toggleFavorite(track.id)}
                onPlayNext={() => addToQueue([track], 'next')}
                onAddToAlbum={() => setPendingTrackForAlbum(track)}
                onRename={(nextTitle, nextArtist) => handleRename(track, nextTitle, nextArtist)}
                measureRef={absoluteIndex === startIndex ? measureTrackRow : undefined}
              />
            );
          })}
        </ul>
      )}

      {bulkAlbumOpen ? (
        <div className="modal-overlay" onClick={() => setBulkAlbumOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Thêm nhiều bài vào album</h3>
              <button className="modal__close" onClick={() => setBulkAlbumOpen(false)} aria-label="Đóng">
                ×
              </button>
            </div>

            <ul className="modal__album-list">
              {(albums ?? []).map((album) => (
                <li key={album.id} className="modal__album-item">
                  <span className="modal__album-name">
                    <span>💿</span> {album.name}
                  </span>
                  <button className="modal__add-btn" onClick={() => void handleBulkAddToAlbum(album.id)}>
                    Thêm {selectedIds.length} bài
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onPlay: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onPlayNext: () => void;
  onAddToAlbum: () => void;
  onRename: (title: string, artist: string | null) => void;
  measureRef?: (node: HTMLLIElement | null) => void;
}

const TrackItem = memo(function TrackItem({
  track,
  isActive,
  isPlaying,
  isSelected,
  onSelect,
  onPlay,
  onDelete,
  onToggleFavorite,
  onPlayNext,
  onAddToAlbum,
  onRename,
  measureRef,
}: TrackItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(track.title);
  const [editArtist, setEditArtist] = useState(track.artist ?? '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus();
    }
  }, [isEditing]);

  const handleEditSave = () => {
    const trimmedTitle = editTitle.trim();
    const trimmedArtist = editArtist.trim();

    if (trimmedTitle && (trimmedTitle !== track.title || trimmedArtist !== (track.artist ?? ''))) {
      onRename(trimmedTitle, trimmedArtist || null);
    }

    setIsEditing(false);
  };

  return (
    <li ref={measureRef} className={`track-item${isActive ? ' track-item--active' : ''}`}>
      <label className="track-item__select">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => onSelect(event.target.checked)}
          aria-label={`Chọn ${track.title}`}
        />
      </label>

      <div className="track-item__thumb-wrap" onClick={onPlay}>
        {track.thumbnail_url ? (
          <img className="track-item__thumb" src={track.thumbnail_url} alt={track.title} loading="lazy" />
        ) : (
          <div className="track-item__thumb track-item__thumb--placeholder">
            <span>🎵</span>
          </div>
        )}
        <div className="track-item__thumb-overlay">
          {isPlaying ? (
            <span className="track-item__playing-bars">
              <span />
              <span />
              <span />
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
              onChange={(event) => setEditTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleEditSave();
                if (event.key === 'Escape') setIsEditing(false);
              }}
              onBlur={handleEditSave}
              placeholder="Tên bài hát"
              maxLength={200}
            />
            <input
              className="track-item__edit-input track-item__edit-input--artist"
              value={editArtist}
              onChange={(event) => setEditArtist(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleEditSave();
                if (event.key === 'Escape') setIsEditing(false);
              }}
              onBlur={handleEditSave}
              placeholder="Nghệ sĩ"
              maxLength={100}
            />
          </div>
        ) : (
          <>
            <div className="track-item__title-row">
              <p className="track-item__title">{track.title}</p>
              <button
                className="track-item__edit-btn"
                onClick={() => setIsEditing(true)}
                aria-label="Đổi tên bài hát"
              >
                ✎
              </button>
            </div>
            {track.artist ? <p className="track-item__artist">{track.artist}</p> : null}
          </>
        )}
      </div>

      <div className="track-item__actions">
        <button
          className={`track-item__fav-btn${track.is_favorite ? ' track-item__fav-btn--active' : ''}`}
          onClick={onToggleFavorite}
          aria-label={track.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          ♥
        </button>
        <button className="track-item__album-btn" onClick={onPlayNext} aria-label="Phát tiếp theo">
          ↥
        </button>
        <button className="track-item__album-btn" onClick={onAddToAlbum} aria-label="Thêm vào album">
          ＋
        </button>
        <button className="track-item__delete" onClick={onDelete} aria-label={`Xóa ${track.title}`}>
          ✕
        </button>
      </div>
    </li>
  );
});

function EmptyState({ search, favoriteOnly }: { search: string; favoriteOnly: boolean }) {
  if (search) {
    return (
      <div className="track-list__empty">
        <div className="track-list__empty-icon">⌕</div>
        <p className="track-list__empty-title">Không tìm thấy kết quả</p>
        <p className="track-list__empty-sub">Thử từ khóa khác hoặc giảm bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="track-list__empty">
      <div className="track-list__empty-icon">{favoriteOnly ? '♥' : '🎵'}</div>
      <p className="track-list__empty-title">{favoriteOnly ? 'Chưa có bài yêu thích' : 'Thư viện trống'}</p>
      <p className="track-list__empty-sub">
        {favoriteOnly ? 'Hãy đánh dấu vài bài hát để quay lại nhanh hơn.' : 'Dán link YouTube ở trên để tải nhạc về.'}
      </p>
    </div>
  );
}
