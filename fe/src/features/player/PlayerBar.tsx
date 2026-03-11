import { usePlayerStore } from './playerStore';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface PlayerBarProps {
  seek: (time: number) => void;
}

export function PlayerBar({ seek }: PlayerBarProps) {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    isLooping, playbackRate,
    setIsPlaying, setVolume, setIsModalOpen,
  } = usePlayerStore();

  if (!currentTrack) return null;

  return (
    <div className="player-bar">
      <TrackInfo
        track={currentTrack}
        isPlaying={isPlaying}
        onExpand={() => setIsModalOpen(true)}
      />
      <PlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onToggle={() => setIsPlaying(!isPlaying)}
        onSeek={seek}
      />
      <RightSection
        volume={volume}
        isLooping={isLooping}
        playbackRate={playbackRate}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

// ─── Presentational sub-components ───────────────────────────────────────────

function TrackInfo({
  track,
  isPlaying,
  onExpand,
}: {
  track: { title: string; artist: string | null; thumbnail_url: string | null };
  isPlaying: boolean;
  onExpand: () => void;
}) {
  return (
    <div className="player-bar__track">
      <div className="player-bar__thumb-wrap" onClick={onExpand} title="Mở trình phát đầy đủ (F)">
        {track.thumbnail_url ? (
          <img
            className="player-bar__thumb"
            src={track.thumbnail_url}
            alt={track.title}
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' } as React.CSSProperties}
          />
        ) : (
          <div className="player-bar__thumb player-bar__thumb--placeholder">🎵</div>
        )}
      </div>
      <div className="player-bar__track-info" onClick={onExpand} style={{ cursor: 'pointer' }}>
        <p className="player-bar__title">{track.title}</p>
        {track.artist && <p className="player-bar__artist">{track.artist}</p>}
      </div>
      <button
        className="player-bar__expand-btn"
        onClick={onExpand}
        title="Mở trình phát đầy đủ (F)"
        aria-label="Mở trình phát đầy đủ"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
    </div>
  );
}

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
}

function PlayerControls({ isPlaying, currentTime, duration, onToggle, onSeek }: PlayerControlsProps) {
  return (
    <div className="player-bar__controls">
      <button
        className="player-bar__skip-btn"
        onClick={() => onSeek(Math.max(0, currentTime - 10))}
        title="Lùi 10 giây (←)"
        aria-label="Lùi 10 giây"
      >
        <SkipBackIcon />
        <span>10</span>
      </button>

      <button
        className="player-bar__play-btn"
        onClick={onToggle}
        aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
      >
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      <button
        className="player-bar__skip-btn"
        onClick={() => onSeek(Math.min(duration, currentTime + 10))}
        title="Tiến 10 giây (→)"
        aria-label="Tiến 10 giây"
      >
        <SkipForwardIcon />
        <span>10</span>
      </button>

      <span className="player-bar__time">{formatTime(currentTime)}</span>

      <div className="player-bar__seek-wrap">
        <input
          className="player-bar__seek"
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Tua nhạc"
        />
        <div
          className="player-bar__seek-fill"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <span className="player-bar__time">{formatTime(duration)}</span>
    </div>
  );
}

interface RightSectionProps {
  volume: number;
  isLooping: boolean;
  playbackRate: number;
  onVolumeChange: (v: number) => void;
}

function RightSection({ volume, isLooping, playbackRate, onVolumeChange }: RightSectionProps) {
  return (
    <div className="player-bar__right">
      {isLooping && (
        <span className="player-bar__badge player-bar__badge--loop" title="Lặp lại đang bật (L)">
          🔁
        </span>
      )}
      {playbackRate !== 1 && (
        <span className="player-bar__badge" title={`Tốc độ ${playbackRate}x`}>
          {playbackRate}x
        </span>
      )}
      <button
        className="player-bar__volume-icon"
        onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
        aria-label={volume === 0 ? 'Bật âm' : 'Tắt âm'}
        title={volume === 0 ? 'Bật âm' : 'Tắt tiếng'}
      >
        {volume === 0 ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
      <div className="player-bar__volume-wrap">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Âm lượng"
        />
        <div className="player-bar__volume-fill" style={{ width: `${volume * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function SkipBackIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-.49-3.51" />
    </svg>
  );
}
