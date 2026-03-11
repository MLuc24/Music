import { DownloaderContainer } from './features/downloader/DownloaderContainer';
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
import './App.css';

function App() {
  const { seek } = useAudioSync();
  usePlayerKeyboard(seek);
  const { isModalOpen } = usePlayerStore();
  const { activeTab, setActiveTab, selectedAlbumId, pendingTrackForAlbum } = useUIStore();

  return (
    <div className="app">
      <div className="app__bg" aria-hidden="true" />
      
      <header className="app__header">
        <div className="app__header-brand">
          <div className="app__logo-mark">🎵</div>
          <h1 className="app__logo">Nhạc</h1>
        </div>
        <nav className="app__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'library'}
            className={`app__tab${activeTab === 'library' ? ' app__tab--active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            Thư viện
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'albums'}
            className={`app__tab${activeTab === 'albums' ? ' app__tab--active' : ''}`}
            onClick={() => setActiveTab('albums')}
          >
            Albums
          </button>
        </nav>
        <div className="app__header-meta">
          <span className="app__badge">Music Player</span>
        </div>
      </header>

      <main className="app__main">
        {activeTab === 'library' && (
          <>
            <section className="app__downloader" aria-label="Tải nhạc từ YouTube">
              <DownloaderContainer />
            </section>
            <section className="app__library" aria-label="Thư viện nhạc">
              <TrackListContainer />
            </section>
          </>
        )}

        {activeTab === 'albums' && (
          <section className="app__library" aria-label="Albums">
            {selectedAlbumId ? (
              <AlbumDetailContainer albumId={selectedAlbumId} />
            ) : (
              <AlbumsContainer />
            )}
          </section>
        )}
      </main>

      <footer className="app__player">
        <PlayerBar seek={seek} />
      </footer>

      {isModalOpen && <PlayerModal seek={seek} />}
      {pendingTrackForAlbum && <AddToAlbumModal />}
    </div>
  );
}

export default App;
