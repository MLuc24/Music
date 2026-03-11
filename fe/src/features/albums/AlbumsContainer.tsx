import { useState } from 'react';
import { useAlbums, useCreateAlbum, useDeleteAlbum, useUpdateAlbum } from './hooks';
import { useUIStore } from '../ui/uiStore';
import type { AlbumWithCount } from './types';

export function AlbumsContainer() {
  const { data: albums, isLoading, isError } = useAlbums();
  const { mutate: createAlbum, isPending: isCreating } = useCreateAlbum();
  const { mutate: deleteAlbum } = useDeleteAlbum();
  const { mutate: updateAlbum } = useUpdateAlbum();
  const { setSelectedAlbumId } = useUIStore();

  const [newName, setNewName] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createAlbum({ name }, { onSuccess: () => setNewName('') });
  };

  const handleRename = () => {
    if (!editingAlbum || !editingAlbum.name.trim()) return;
    updateAlbum({ id: editingAlbum.id, name: editingAlbum.name.trim() }, {
      onSuccess: () => setEditingAlbum(null),
    });
  };

  const handleDelete = (album: AlbumWithCount) => {
    if (confirm(`Xóa album "${album.name}"? Các bài hát sẽ không bị xóa.`)) {
      deleteAlbum(album.id);
    }
  };

  if (isLoading) return (
    <div className="track-list__state">
      <div className="track-list__loading-spinner" />
      <p>Đang tải albums...</p>
    </div>
  );

  if (isError) return <p className="track-list__state track-list__state--error">Lỗi khi tải albums</p>;

  return (
    <div className="albums-container">
      {/* Create new album */}
      <div className="albums-create">
        <input
          className="albums-create__input"
          type="text"
          placeholder="Tên album mới..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          maxLength={100}
        />
        <button
          className="albums-create__btn"
          onClick={handleCreate}
          disabled={isCreating || !newName.trim()}
        >
          {isCreating ? '...' : '+ Tạo album'}
        </button>
      </div>

      {!albums?.length ? (
        <div className="track-list__empty">
          <div className="track-list__empty-icon">💿</div>
          <p className="track-list__empty-title">Chưa có album nào</p>
          <p className="track-list__empty-sub">Tạo album đầu tiên của bạn ở trên</p>
        </div>
      ) : (
        <div className="albums-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card" onClick={() => setSelectedAlbumId(album.id)}>
              <div className="album-card__cover">
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.name} loading="lazy" />
                ) : (
                  <span className="album-card__cover-placeholder">💿</span>
                )}
              </div>
              <div className="album-card__info">
                {editingAlbum?.id === album.id ? (
                  <input
                    className="album-card__rename-input"
                    value={editingAlbum.name}
                    autoFocus
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') setEditingAlbum(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={handleRename}
                    maxLength={100}
                  />
                ) : (
                  <p className="album-card__name">{album.name}</p>
                )}
                <p className="album-card__count">{album.track_count} bài</p>
              </div>
              <div className="album-card__actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="album-card__action-btn"
                  title="Đổi tên"
                  onClick={() => setEditingAlbum({ id: album.id, name: album.name })}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="album-card__action-btn album-card__action-btn--danger"
                  title="Xóa album"
                  onClick={() => handleDelete(album)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
