import { useTracks, useDeleteTrack } from '../tracks/hooks';
import { tracksApi } from '../tracks/api';
import { usePlayerStore } from '../player/playerStore';
import type { Track } from '../../types/database';

export function TrackListContainer() {
  const { data: tracks, isLoading, isError } = useTracks();
  const { mutate: deleteTrack } = useDeleteTrack();
  const { setCurrentTrack, currentTrack, isPlaying } = usePlayerStore();

  const handlePlay = async (track: Track) => {
    try {
      const streamUrl = await tracksApi.getStreamUrl(track.storage_path);
      setCurrentTrack(track, streamUrl);
    } catch {
      // TODO: show toast notification
    }
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
        <span className="track-list__count">{tracks.length} bài hát</span>
      </div>
      <ul className="track-list" role="list">
        {tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={currentTrack?.id === track.id && isPlaying}
            onPlay={() => handlePlay(track)}
            onDelete={() => handleDelete(track)}
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
}

function TrackItem({ track, isActive, isPlaying, onPlay, onDelete }: TrackItemProps) {
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
        <p className="track-item__title">{track.title}</p>
        {track.artist && <p className="track-item__artist">{track.artist}</p>}
      </div>

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
    </li>
  );
}

function EmptyState() {
  return (
    <div className="track-list__empty">
      <div className="track-list__empty-icon">🎵</div>
      <p className="track-list__empty-title">Thư viện trống</p>
      <p className="track-list__empty-sub">Dán link YouTube ở trên để tải nhạc về</p>
    </div>
  );
}
