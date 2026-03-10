import { DownloaderContainer } from './features/downloader/DownloaderContainer';
import { TrackListContainer } from './features/tracks/TrackListContainer';
import { PlayerBar } from './features/player/PlayerBar';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <span className="app__logo-icon">🎵</span>
        <h1 className="app__logo">Nhạc</h1>
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
