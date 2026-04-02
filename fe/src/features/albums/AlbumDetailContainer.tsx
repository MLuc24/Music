import { useTracks } from '../tracks/hooks';
import { useAlbumDetail, useRemoveTrackFromAlbum, useAddTrackToAlbum } from './hooks';
import { useUIStore } from '../ui/uiStore';
import { usePlayerStore } from '../player/playerStore';
import { tracksApi } from '../tracks/api';
import type { Track } from '../../types/database';

interface Props {
  albumId: string;
}

export function AlbumDetailContainer({ albumId }: Props) {
  const { data, isLoading, isError } = useAlbumDetail(albumId);
  const { data: allTracks } = useTracks();
  const { mutate: removeTrack } = useRemoveTrackFromAlbum();
  const { mutate: addTrack } = useAddTrackToAlbum();
  const setSelectedAlbumId = useUIStore((state) => state.setSelectedAlbumId);
  const isAddTracksOpen = useUIStore((state) => state.isAddTracksOpen);
  const setIsAddTracksOpen = useUIStore((state) => state.setIsAddTracksOpen);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const handlePlay = async (track: Track) => {
    try {
      const streamUrl = await tracksApi.getStreamUrl(track.storage_path);
      setCurrentTrack(track, streamUrl);
    } catch (error) {
      console.error('Failed to play album track:', track.id, track.storage_path, error);
    }
  };

  const tracksInAlbum = new Set(data?.tracks.map((t) => t.id) ?? []);
  const availableTracks = (allTracks ?? []).filter((t) => !tracksInAlbum.has(t.id));

  if (isLoading) return (
    <div className="track-list__state">
      <div className="track-list__loading-spinner" />
      <p>Đang tải album...</p>
    </div>
  );

  if (isError || !data) return (
    <p className="track-list__state track-list__state--error">Lỗi khi tải album</p>
  );

  return (
    <div className="album-detail">
      <div className="album-detail__header">
        <button className="album-detail__back-btn" onClick={() => setSelectedAlbumId(null)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Tất cả albums
        </button>
        <div className="album-detail__title-wrap">
          <h2 className="album-detail__title">{data.album.name}</h2>
          {data.album.description && (
            <p className="album-detail__desc">{data.album.description}</p>
          )}
          <span className="album-detail__count">{data.tracks.length} bài hát</span>
        </div>
        <button
          className="album-detail__add-btn"
          onClick={() => setIsAddTracksOpen(true)}
        >
          + Thêm bài hát
        </button>
      </div>

      {!data.tracks.length ? (
        <div className="track-list__empty">
          <div className="track-list__empty-icon">🎵</div>
          <p className="track-list__empty-title">Album trống</p>
          <p className="track-list__empty-sub">Nhấn "Thêm bài hát" để thêm nhạc vào album</p>
        </div>
      ) : (
        <ul className="track-list" role="list">
          {data.tracks.map((track) => (
            <li
              key={track.id}
              className={`track-item${currentTrackId === track.id ? ' track-item--active' : ''}`}
            >
              <div className="track-item__thumb-wrap" onClick={() => handlePlay(track)}>
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
                  {currentTrackId === track.id && isPlaying ? (
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
              <div className="track-item__actions">
                <button
                  className="track-item__delete"
                  onClick={() => removeTrack({ albumId, trackId: track.id })}
                  aria-label={`Xóa ${track.title} khỏi album`}
                  title="Xóa khỏi album"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add tracks modal */}
      {isAddTracksOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTracksOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Thêm bài hát vào album</h3>
              <button className="modal__close" onClick={() => setIsAddTracksOpen(false)}>✕</button>
            </div>
            {!availableTracks.length ? (
              <p className="modal__empty">Tất cả bài hát đã có trong album này</p>
            ) : (
              <ul className="modal__track-list">
                {availableTracks.map((track) => (
                  <li key={track.id} className="modal__track-item">
                    <div className="modal__track-info">
                      <p className="modal__track-title">{track.title}</p>
                      {track.artist && <p className="modal__track-artist">{track.artist}</p>}
                    </div>
                    <button
                      className="modal__add-btn"
                      onClick={() => addTrack({ albumId, trackId: track.id })}
                    >
                      + Thêm
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
