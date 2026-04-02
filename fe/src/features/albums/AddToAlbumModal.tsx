import { useState } from 'react';
import { useUIStore } from '../ui/uiStore';
import { useAlbums, useCreateAlbum, useAddTrackToAlbum } from '../albums/hooks';

export function AddToAlbumModal() {
  const pendingTrackForAlbum = useUIStore((state) => state.pendingTrackForAlbum);
  const setPendingTrackForAlbum = useUIStore((state) => state.setPendingTrackForAlbum);
  const { data: albums, isLoading } = useAlbums();
  const { mutate: addTrack, isPending: isAdding } = useAddTrackToAlbum();
  const { mutate: createAlbum, isPending: isCreating } = useCreateAlbum();

  const [newAlbumName, setNewAlbumName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [addedAlbumIds, setAddedAlbumIds] = useState<Set<string>>(new Set());

  if (!pendingTrackForAlbum) return null;

  const track = pendingTrackForAlbum;

  const handleClose = () => {
    setPendingTrackForAlbum(null);
    setNewAlbumName('');
    setShowCreate(false);
    setAddedAlbumIds(new Set());
  };

  const handleAdd = (albumId: string) => {
    addTrack({ albumId, trackId: track.id }, {
      onSuccess: () => setAddedAlbumIds((prev) => new Set([...prev, albumId])),
    });
  };

  const handleCreateAndAdd = () => {
    const name = newAlbumName.trim();
    if (!name) return;
    createAlbum({ name }, {
      onSuccess: (newAlbum) => {
        addTrack({ albumId: newAlbum.id, trackId: track.id }, {
          onSuccess: () => {
            setAddedAlbumIds((prev) => new Set([...prev, newAlbum.id]));
            setNewAlbumName('');
            setShowCreate(false);
          },
        });
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Thêm vào album</h3>
          <button className="modal__close" onClick={handleClose}>✕</button>
        </div>
        <p className="modal__subtitle">"{track.title}"</p>

        {isLoading ? (
          <p className="modal__empty">Đang tải...</p>
        ) : (
          <>
            {!albums?.length && !showCreate ? (
              <p className="modal__empty">Chưa có album nào.</p>
            ) : (
              <ul className="modal__album-list">
                {(albums ?? []).map((album) => (
                  <li key={album.id} className="modal__album-item">
                    <span className="modal__album-name">
                      <span>💿</span> {album.name}
                      <span className="modal__album-count">{album.track_count} bài</span>
                    </span>
                    {addedAlbumIds.has(album.id) ? (
                      <span className="modal__added-badge">✓ Đã thêm</span>
                    ) : (
                      <button
                        className="modal__add-btn"
                        onClick={() => handleAdd(album.id)}
                        disabled={isAdding}
                      >
                        + Thêm
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {showCreate ? (
              <div className="modal__create-form">
                <input
                  className="albums-create__input"
                  type="text"
                  placeholder="Tên album mới..."
                  value={newAlbumName}
                  autoFocus
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                  maxLength={100}
                />
                <button
                  className="albums-create__btn"
                  onClick={handleCreateAndAdd}
                  disabled={isCreating || !newAlbumName.trim()}
                >
                  {isCreating ? '...' : 'Tạo & thêm'}
                </button>
                <button className="modal__cancel-btn" onClick={() => setShowCreate(false)}>
                  Hủy
                </button>
              </div>
            ) : (
              <button className="modal__new-album-btn" onClick={() => setShowCreate(true)}>
                + Tạo album mới
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
