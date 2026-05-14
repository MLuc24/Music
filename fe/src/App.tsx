import { DownloaderContainer } from './features/downloader/DownloaderContainer';
import { DownloadCenterView } from './features/downloader/DownloadCenterView';
import { TrackListContainer } from './features/tracks/TrackListContainer';
import { AlbumsContainer } from './features/albums/AlbumsContainer';
import { AlbumDetailContainer } from './features/albums/AlbumDetailContainer';
import { AddToAlbumModal } from './features/albums/AddToAlbumModal';
import { PlayerBar } from './features/player/PlayerBar';
import { PlayerModal } from './features/player/PlayerModal';
import { useAudioSync } from './features/player/useAudioSync';
import { usePlayerKeyboard } from './features/player/usePlayerKeyboard';
import { usePlayerStore } from './features/player/playerStore';
import { useUIStore } from './features/ui/uiStore';
import { ToastViewport } from './features/ui/ToastViewport';
import { CommandPalette } from './features/ui/CommandPalette';
import { HomeDashboard } from './features/home/HomeDashboard';
import './App.css';
import './styles/shell.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Tổng quan', icon: '⌂' },
  { id: 'library', label: 'Thư viện', icon: '▣' },
  { id: 'favorites', label: 'Yêu thích', icon: '♡' },
  { id: 'albums', label: 'Album', icon: '◉' },
  { id: 'downloads', label: 'Tải xuống', icon: '↓' },
] as const;

function App() {
  const { seek } = useAudioSync();
  usePlayerKeyboard(seek);

  const isModalOpen = usePlayerStore((state) => state.isModalOpen);
  const queue = usePlayerStore((state) => state.queue);
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const selectedAlbumId = useUIStore((state) => state.selectedAlbumId);
  const pendingTrackForAlbum = useUIStore((state) => state.pendingTrackForAlbum);

  return (
    <div className="app-shell">
      <div className="app-shell__bg" aria-hidden="true" />

      <aside className="app-rail">
        <div className="app-rail__brand">
          <div className="app-rail__brand-mark">N</div>
          <div>
            <p className="app-rail__brand-title">Nhạc</p>
            <span className="app-rail__brand-subtitle">Nghe và lưu cục bộ</span>
          </div>
        </div>

        <nav className="app-rail__nav" aria-label="Điều hướng">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`app-rail__link${activeView === item.id ? ' app-rail__link--active' : ''}`}
              onClick={() => setActiveView(item.id)}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              <span className="app-rail__link-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="app-rail__footer">
          <button className="app-rail__shortcut" onClick={() => useUIStore.getState().setIsCommandPaletteOpen(true)}>
            Tìm nhanh
            <span>Ctrl/Cmd + K</span>
          </button>
          <div className="app-rail__queue-indicator">
            <span>Tiếp theo</span>
            <strong>{queue.length}</strong>
          </div>
        </div>
      </aside>

      <div className="app-shell__content">
        <header className="app-header">
          <div>
            <p className="app-header__eyebrow">Ứng dụng nghe nhạc cục bộ</p>
            <h1 className="app-header__title">
              {activeView === 'home' && 'Tổng quan'}
              {activeView === 'library' && 'Thư viện'}
              {activeView === 'favorites' && 'Yêu thích'}
              {activeView === 'albums' && 'Album'}
              {activeView === 'downloads' && 'Tải xuống'}
            </h1>
          </div>

          <button
            className="app-header__search"
            onClick={() => useUIStore.getState().setIsCommandPaletteOpen(true)}
            aria-label="Mở Command Palette"
          >
            <span className="app-header__search-copy">
              <strong>Tìm nhanh</strong>
              <span>Bài hát, album hoặc thao tác</span>
            </span>
            <span className="app-header__search-shortcut">Ctrl/Cmd + K</span>
          </button>
        </header>

        <main className="app-main">
          {activeView === 'home' ? (
            <>
              <section className="app-section app-section--compact">
                <DownloaderContainer />
              </section>
              <section className="app-section app-section--fill">
                <HomeDashboard />
              </section>
            </>
          ) : null}

          {activeView === 'library' ? (
            <>
              <section className="app-section app-section--compact">
                <DownloaderContainer />
              </section>
              <section className="app-section app-section--fill">
                <TrackListContainer title="Toàn bộ thư viện" />
              </section>
            </>
          ) : null}

          {activeView === 'favorites' ? (
            <section className="app-section app-section--fill">
              <TrackListContainer favoriteOnly title="Bài hát yêu thích" />
            </section>
          ) : null}

          {activeView === 'albums' ? (
            <section className="app-section app-section--fill">
              {selectedAlbumId ? <AlbumDetailContainer albumId={selectedAlbumId} /> : <AlbumsContainer />}
            </section>
          ) : null}

          {activeView === 'downloads' ? (
            <>
              <section className="app-section app-section--compact">
                <DownloaderContainer />
              </section>
              <section className="app-section app-section--fill">
                <DownloadCenterView />
              </section>
            </>
          ) : null}
        </main>

        <footer className="app-player">
          <PlayerBar seek={seek} />
        </footer>
      </div>

      {isModalOpen ? <PlayerModal seek={seek} /> : null}
      {pendingTrackForAlbum ? <AddToAlbumModal /> : null}
      <CommandPalette />
      <ToastViewport />
    </div>
  );
}

export default App;
