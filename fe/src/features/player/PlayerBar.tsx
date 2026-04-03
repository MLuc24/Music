import type { CSSProperties } from 'react';
import { usePlayerStore } from './playerStore';

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

interface PlayerBarProps {
  seek: (time: number) => void;
}

export function PlayerBar({ seek }: PlayerBarProps) {
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
  const setIsModalOpen = usePlayerStore((state) => state.setIsModalOpen);

  if (!currentTrack) return null;

  return (
    <div className="player-bar">
      <div className="player-bar__track">
        <div className="player-bar__thumb-wrap" onClick={() => setIsModalOpen(true)} title="Mở trình phát đầy đủ">
          {currentTrack.thumbnail_url ? (
            <img
              className="player-bar__thumb"
              src={currentTrack.thumbnail_url}
              alt={currentTrack.title}
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' } as CSSProperties}
            />
          ) : (
            <div className="player-bar__thumb player-bar__thumb--placeholder">🎵</div>
          )}
        </div>

        <div className="player-bar__track-info" onClick={() => setIsModalOpen(true)} role="button" tabIndex={0}>
          <p className="player-bar__title">{currentTrack.title}</p>
          {currentTrack.artist ? <p className="player-bar__artist">{currentTrack.artist}</p> : null}
        </div>

        <button className="player-bar__expand-btn" onClick={() => setIsModalOpen(true)} aria-label="Mở trình phát">
          ⤢
        </button>
      </div>

      <div className="player-bar__controls">
        <button className="player-bar__skip-btn" onClick={() => seek(Math.max(0, currentTime - 10))} aria-label="Lùi 10 giây">
          ↺ 10
        </button>

        <button className="player-bar__play-btn" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}>
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <button className="player-bar__skip-btn" onClick={() => seek(Math.min(duration, currentTime + 10))} aria-label="Tiến 10 giây">
          10 ↻
        </button>

        <span className="player-bar__time">{formatTime(currentTime)}</span>
        <div className="player-bar__seek-wrap">
          <input
            className="player-bar__seek"
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Tua nhạc"
          />
          <div className="player-bar__seek-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <span className="player-bar__time">{formatTime(duration)}</span>
      </div>

      <div className="player-bar__right">
        <span className="player-bar__badge" title="Số bài đang chờ phát">Queue {queue.length}</span>
        {isLooping ? <span className="player-bar__badge player-bar__badge--loop">↺</span> : null}
        {playbackRate !== 1 ? <span className="player-bar__badge">{playbackRate}x</span> : null}

        <button
          className="player-bar__volume-icon"
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          aria-label={volume === 0 ? 'Bật âm' : 'Tắt tiếng'}
        >
          {volume === 0 ? '🔇' : '🔊'}
        </button>

        <div className="player-bar__volume-wrap">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Âm lượng"
          />
          <div className="player-bar__volume-fill" style={{ width: `${volume * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
