import { DownloaderContainer } from './features/downloader/DownloaderContainer';
import { TrackListContainer } from './features/tracks/TrackListContainer';
import { PlayerBar } from './features/player/PlayerBar';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="app__bg" aria-hidden="true" />
      
      <header className="app__header">
        <div className="app__header-brand">
          <div className="app__logo-mark">🎵</div>
          <h1 className="app__logo">Nhạc</h1>
        </div>
        <div className="app__header-meta">
          <span className="app__badge">Music Player</span>
        </div>
      </header>

      <main className="app__main">
        <section className="app__downloader" aria-label="Tải nhạc từ YouTube">
          <DownloaderContainer />
        </section>

        <section className="app__library" aria-label="Thư viện nhạc">
          <TrackListContainer />
        </section>
      </main>

      <footer className="app__player">
        <PlayerBar />
      </footer>
    </div>
  );
}

export default App;
