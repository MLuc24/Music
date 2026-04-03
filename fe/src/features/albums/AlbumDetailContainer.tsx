import { useMemo } from 'react';
import { useTracks } from '../tracks/hooks';
import { useAlbumDetail, useRemoveTrackFromAlbum, useAddTrackToAlbum, useReorderAlbumTracks } from './hooks';
import { useUIStore } from '../ui/uiStore';
import { usePlayerStore } from '../player/playerStore';
import { useToastStore } from '../ui/toastStore';
interface Props {
  albumId: string;
}

export function AlbumDetailContainer({ albumId }: Props) {
  const { data, isLoading, isError } = useAlbumDetail(albumId);
  const { data: allTracks } = useTracks({ sort: 'newest' });
  const { mutate: removeTrack } = useRemoveTrackFromAlbum();
  const { mutate: addTrack } = useAddTrackToAlbum();
  const { mutate: reorderTracks } = useReorderAlbumTracks();
  const setSelectedAlbumId = useUIStore((state) => state.setSelectedAlbumId);
  const isAddTracksOpen = useUIStore((state) => state.isAddTracksOpen);
  const setIsAddTracksOpen = useUIStore((state) => state.setIsAddTracksOpen);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const playTracks = usePlayerStore((state) => state.playTracks);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const showToast = useToastStore((state) => state.showToast);

  const tracksInAlbum = new Set(data?.tracks.map((track) => track.id) ?? []);
  const availableTracks = (allTracks ?? []).filter((track) => !tracksInAlbum.has(track.id));

  const moveTrack = (trackId: string, direction: -1 | 1) => {
    if (!data) return;

    const currentIndex = data.tracks.findIndex((track) => track.id === trackId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.tracks.length) return;

    const reordered = [...data.tracks];
    const [item] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, item);

    reorderTracks(
      { albumId, trackIds: reordered.map((track) => track.id) },
      {
        onSuccess: () =>
          showToast({
            title: 'Đã cập nhật thứ tự album',
            description: 'Thứ tự phát trong album đã được lưu.',
            tone: 'success',
          }),
      },
    );
  };

  const coverTrack = useMemo(() => data?.tracks[0] ?? null, [data?.tracks]);

  if (isLoading) {
    return (
      <div className="track-list__state">
        <div className="track-list__loading-spinner" />
        <p>Đang tải album...</p>
      </div>
    );
  }

  if (isError || !data) {
    return <p className="track-list__state track-list__state--error">Lỗi khi tải album.</p>;
  }

  return (
    <div className="album-detail">
      <div className="album-detail__hero">
        <button className="album-detail__back-btn" onClick={() => setSelectedAlbumId(null)}>
          ← Tất cả albums
        </button>

        <div className="album-detail__cover">
          {coverTrack?.thumbnail_url ? (
            <img src={coverTrack.thumbnail_url} alt={data.album.name} />
          ) : (
            <span>💿</span>
          )}
        </div>

        <div className="album-detail__hero-copy">
          <p className="album-detail__eyebrow">Album</p>
          <h2 className="album-detail__title">{data.album.name}</h2>
          {data.album.description ? <p className="album-detail__desc">{data.album.description}</p> : null}
          <span className="album-detail__count">{data.tracks.length} bài hát</span>

          <div className="album-detail__cta">
            <button className="album-detail__add-btn" onClick={() => void playTracks(data.tracks, 0)}>
              Phát album
            </button>
            <button className="album-detail__secondary-btn" onClick={() => addToQueue(data.tracks, 'end')}>
              Thêm vào queue
            </button>
            <button className="album-detail__secondary-btn" onClick={() => setIsAddTracksOpen(true)}>
              + Thêm bài hát
            </button>
          </div>
        </div>
      </div>

      {!data.tracks.length ? (
        <div className="track-list__empty">
          <div className="track-list__empty-icon">🎵</div>
          <p className="track-list__empty-title">Album trống</p>
          <p className="track-list__empty-sub">Nhấn "Thêm bài hát" để làm đầy album này.</p>
        </div>
      ) : (
        <ul className="track-list" role="list">
          {data.tracks.map((track, index) => (
            <li key={track.id} className={`track-item${currentTrackId === track.id ? ' track-item--active' : ''}`}>
              <span className="album-detail__position">{index + 1}</span>

              <div className="track-item__thumb-wrap" onClick={() => void playTrack(track)}>
                {track.thumbnail_url ? (
                  <img className="track-item__thumb" src={track.thumbnail_url} alt={track.title} loading="lazy" />
                ) : (
                  <div className="track-item__thumb track-item__thumb--placeholder">
                    <span>🎵</span>
                  </div>
                )}
                <div className="track-item__thumb-overlay">
                  {currentTrackId === track.id && isPlaying ? (
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
                <p className="track-item__title">{track.title}</p>
                {track.artist ? <p className="track-item__artist">{track.artist}</p> : null}
              </div>

              <div className="track-item__actions track-item__actions--always">
                <button className="track-item__album-btn" onClick={() => moveTrack(track.id, -1)} aria-label="Lên trên">
                  ↑
                </button>
                <button className="track-item__album-btn" onClick={() => moveTrack(track.id, 1)} aria-label="Xuống dưới">
                  ↓
                </button>
                <button className="track-item__album-btn" onClick={() => addToQueue([track], 'next')} aria-label="Phát tiếp theo">
                  ↥
                </button>
                <button
                  className="track-item__delete"
                  onClick={() => removeTrack({ albumId, trackId: track.id })}
                  aria-label={`Xóa ${track.title} khỏi album`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isAddTracksOpen ? (
        <div className="modal-overlay" onClick={() => setIsAddTracksOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Thêm bài hát vào album</h3>
              <button className="modal__close" onClick={() => setIsAddTracksOpen(false)} aria-label="Đóng">
                ×
              </button>
            </div>

            {!availableTracks.length ? (
              <p className="modal__empty">Tất cả bài hát đã có trong album này.</p>
            ) : (
              <ul className="modal__track-list">
                {availableTracks.map((track) => (
                  <li key={track.id} className="modal__track-item">
                    <div className="modal__track-info">
                      <p className="modal__track-title">{track.title}</p>
                      {track.artist ? <p className="modal__track-artist">{track.artist}</p> : null}
                    </div>
                    <button className="modal__add-btn" onClick={() => addTrack({ albumId, trackId: track.id })}>
                      + Thêm
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
