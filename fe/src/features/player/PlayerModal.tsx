import { useMemo } from 'react';
import { usePlayerStore } from './playerStore';
import { LyricsPanel } from '../lyrics/LyricsPanel';
import { useTracks } from '../tracks/hooks';
import { SuggestedTracks } from '../tracks/SuggestedTracks';
import type { Track } from '../../types/database';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

interface PlayerModalProps {
  seek: (time: number) => void;
}

export function PlayerModal({ seek }: PlayerModalProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const isLooping = usePlayerStore((state) => state.isLooping);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const queue = usePlayerStore((state) => state.queue);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setIsLooping = usePlayerStore((state) => state.setIsLooping);
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate);
  const setIsModalOpen = usePlayerStore((state) => state.setIsModalOpen);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const { data: tracks } = useTracks({ limit: 20, sort: 'newest' });

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const upNext = useMemo(() => queue.slice(0, 5), [queue]);

  if (!currentTrack) return null;

  return (
    <div className="player-modal" role="dialog" aria-modal="true" aria-label="Trình phát đầy đủ">
      <div
        className="player-modal__ambient"
        style={{ backgroundImage: currentTrack.thumbnail_url ? `url(${currentTrack.thumbnail_url})` : undefined }}
      />

      <div className="player-modal__inner">
        <div className="player-modal__panel player-modal__panel--player">
          <header className="player-modal__header">
            <button className="player-modal__icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Thu gọn">
              ↓
            </button>
            <p className="player-modal__now-playing">Đang phát</p>
            <div className="player-modal__shortcuts-area">
              <button className="player-modal__shortcuts-btn" aria-label="Phím tắt">?</button>
              <div className="player-modal__shortcuts-popup">
                <div className="player-modal__shortcuts-grid">
                  <kbd>0 - 9</kbd><span>Tua theo phần trăm</span>
                  <kbd>Space / K</kbd><span>Phát hoặc dừng</span>
                  <kbd>← →</kbd><span>±5 giây</span>
                  <kbd>Shift + ← →</kbd><span>±30 giây</span>
                  <kbd>↑ ↓</kbd><span>Âm lượng ±5%</span>
                  <kbd>M</kbd><span>Tắt hoặc bật tiếng</span>
                  <kbd>L</kbd><span>Bật hoặc tắt lặp</span>
                  <kbd>&lt; &gt;</kbd><span>Giảm hoặc tăng tốc độ</span>
                  <kbd>F / Esc</kbd><span>Mở hoặc đóng modal</span>
                </div>
              </div>
            </div>
          </header>

          <div className="player-modal__artwork-section">
            <div className={`player-modal__disc${isPlaying ? ' player-modal__disc--spinning' : ''}`}>
              {currentTrack.thumbnail_url ? (
                <img className="player-modal__artwork" src={currentTrack.thumbnail_url} alt={currentTrack.title} />
              ) : (
                <div className="player-modal__artwork player-modal__artwork--placeholder">🎵</div>
              )}
              <div className="player-modal__disc-shadow" />
              <div className="player-modal__disc-hole" />
            </div>
          </div>

          <div className="player-modal__track-info">
            <h2 className="player-modal__title">{currentTrack.title}</h2>
            {currentTrack.artist ? <p className="player-modal__artist">{currentTrack.artist}</p> : null}
          </div>

          <div className="player-modal__progress">
            <div className="player-modal__seekbar-wrap">
              <div className="player-modal__seekbar-bg" />
              <div className="player-modal__seekbar-fill" style={{ width: `${progress}%` }} />
              <input
                className="player-modal__seekbar"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(event) => seek(Number(event.target.value))}
                aria-label="Tua nhạc"
              />
            </div>

            <div className="player-modal__time-row">
              <span className="player-modal__time">{formatTime(currentTime)}</span>
              <span className="player-modal__time">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="player-modal__controls">
            <button className="player-modal__skip-btn" onClick={() => seek(Math.max(0, currentTime - 30))}>30</button>
            <button className="player-modal__skip-btn" onClick={() => seek(Math.max(0, currentTime - 10))}>10</button>
            <button
              className="player-modal__play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button className="player-modal__skip-btn" onClick={() => seek(Math.min(duration, currentTime + 10))}>10</button>
            <button className="player-modal__skip-btn" onClick={() => seek(Math.min(duration, currentTime + 30))}>30</button>
          </div>

          <div className="player-modal__secondary">
            <button
              className={`player-modal__loop-btn${isLooping ? ' player-modal__loop-btn--active' : ''}`}
              onClick={() => setIsLooping(!isLooping)}
            >
              ↺ <span>Lặp</span>
            </button>

            <div className="player-modal__speed-group" role="group" aria-label="Tốc độ phát">
              {RATES.map((rate) => (
                <button
                  key={rate}
                  className={`player-modal__speed-btn${playbackRate === rate ? ' player-modal__speed-btn--active' : ''}`}
                  onClick={() => setPlaybackRate(rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div className="player-modal__volume">
            <button className="player-modal__icon-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.8)}>
              {volume === 0 ? '🔇' : '🔊'}
            </button>
            <div className="player-modal__vol-wrap">
              <div className="player-modal__vol-bg" />
              <div className="player-modal__vol-fill" style={{ width: `${volume * 100}%` }} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Âm lượng"
              />
            </div>
          </div>

          <section className="player-modal__queue">
            <div className="player-modal__queue-header">
              <h3>Up Next</h3>
              <span>{queue.length} bài</span>
            </div>
            <ul className="player-modal__queue-list">
              {upNext.map((item) => (
                <li key={item.id} className="player-modal__queue-item">
                  <button className="player-modal__queue-main" onClick={() => void playTrack(item.track)}>
                    <span>{item.track.title}</span>
                    {item.track.artist ? <small>{item.track.artist}</small> : null}
                  </button>
                  <button className="player-modal__queue-remove" onClick={() => removeFromQueue(item.id)} aria-label="Bỏ khỏi queue">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <SuggestedTracks
            tracks={tracks ?? []}
            currentTrackId={currentTrack.id}
            historyVersion={queue.length}
            onPlay={(track: Track) => void playTrack(track)}
          />
        </div>

        <div className="player-modal__panel player-modal__panel--lyrics">
          <LyricsPanel track={currentTrack} currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}
