import { usePlayerStore } from './playerStore';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface PlayerModalProps {
  seek: (time: number) => void;
}

export function PlayerModal({ seek }: PlayerModalProps) {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    isLooping, playbackRate,
    setIsPlaying, setVolume, setIsLooping, setPlaybackRate, setIsModalOpen,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-modal" role="dialog" aria-modal="true" aria-label="Trình phát đầy đủ">
      {/* Ambient blurred background from artwork */}
      <div
        className="player-modal__ambient"
        style={currentTrack.thumbnail_url ? { backgroundImage: `url(${currentTrack.thumbnail_url})` } : undefined}
      />

      <div className="player-modal__inner">
        {/* ── Header ── */}
        <header className="player-modal__header">
          <button
            className="player-modal__icon-btn"
            onClick={() => setIsModalOpen(false)}
            aria-label="Thu gọn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <p className="player-modal__now-playing">Đang phát</p>
          <div className="player-modal__header-spacer" />
        </header>

        {/* ── Vinyl disc artwork ── */}
        <div className="player-modal__artwork-section">
          <div className={`player-modal__disc${isPlaying ? ' player-modal__disc--spinning' : ''}`}>
            {currentTrack.thumbnail_url ? (
              <img
                className="player-modal__artwork"
                src={currentTrack.thumbnail_url}
                alt={currentTrack.title}
              />
            ) : (
              <div className="player-modal__artwork player-modal__artwork--placeholder">🎵</div>
            )}
            <div className="player-modal__disc-shadow" />
            <div className="player-modal__disc-hole" />
          </div>
        </div>

        {/* ── Track info ── */}
        <div className="player-modal__track-info">
          <h2 className="player-modal__title">{currentTrack.title}</h2>
          {currentTrack.artist && <p className="player-modal__artist">{currentTrack.artist}</p>}
        </div>

        {/* ── Progress bar ── */}
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
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Tua nhạc"
            />
          </div>

          {/* Quick-jump segment markers */}
          <div className="player-modal__markers" aria-hidden="true">
            {[{ pct: 25, label: '¼' }, { pct: 50, label: '½' }, { pct: 75, label: '¾' }].map(({ pct, label }) => (
              <button
                key={pct}
                className="player-modal__marker"
                style={{ left: `${pct}%` }}
                onClick={() => seek(duration * pct / 100)}
                title={`Tua đến ${pct}% (phím ${pct / 10})`}
                tabIndex={-1}
              >
                <span className="player-modal__marker-pip" />
                <span className="player-modal__marker-label">{label}</span>
              </button>
            ))}
          </div>

          <div className="player-modal__time-row">
            <span className="player-modal__time">{formatTime(currentTime)}</span>
            <span className="player-modal__time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Main controls ── */}
        <div className="player-modal__controls">
          <SkipButton
            seconds={30}
            direction="back"
            onClick={() => seek(Math.max(0, currentTime - 30))}
            title="Lùi 30 giây (Shift+←)"
          />
          <SkipButton
            seconds={10}
            direction="back"
            onClick={() => seek(Math.max(0, currentTime - 10))}
            title="Lùi 10 giây (←)"
          />
          <button
            className="player-modal__play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
          </button>
          <SkipButton
            seconds={10}
            direction="forward"
            onClick={() => seek(Math.min(duration, currentTime + 10))}
            title="Tiến 10 giây (→)"
          />
          <SkipButton
            seconds={30}
            direction="forward"
            onClick={() => seek(Math.min(duration, currentTime + 30))}
            title="Tiến 30 giây (Shift+→)"
          />
        </div>

        {/* ── Secondary: loop + speed ── */}
        <div className="player-modal__secondary">
          <button
            className={`player-modal__loop-btn${isLooping ? ' player-modal__loop-btn--active' : ''}`}
            onClick={() => setIsLooping(!isLooping)}
            title="Lặp lại (L)"
            aria-pressed={isLooping}
          >
            <LoopIcon />
            <span>Lặp</span>
          </button>

          <div className="player-modal__speed-group" role="group" aria-label="Tốc độ phát">
            {RATES.map((r) => (
              <button
                key={r}
                className={`player-modal__speed-btn${playbackRate === r ? ' player-modal__speed-btn--active' : ''}`}
                onClick={() => setPlaybackRate(r)}
                title={`Tốc độ ${r}x (phím < >)`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>

        {/* ── Volume ── */}
        <div className="player-modal__volume">
          <button
            className="player-modal__icon-btn"
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            aria-label={volume === 0 ? 'Bật âm' : 'Tắt tiếng'}
          >
            {volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
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
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Âm lượng"
            />
          </div>
          <span className="player-modal__vol-pct">{Math.round(volume * 100)}%</span>
        </div>

        {/* ── Keyboard shortcuts reference ── */}
        <div className="player-modal__shortcuts">
          <p className="player-modal__shortcuts-title">Phím tắt</p>
          <div className="player-modal__shortcuts-grid">
            <kbd>0 – 9</kbd><span>Tua đến 0% – 90%</span>
            <kbd>Space / K</kbd><span>Phát / Dừng</span>
            <kbd>← →</kbd><span>±5 giây</span>
            <kbd>Shift + ← →</kbd><span>±30 giây</span>
            <kbd>↑ ↓</kbd><span>Âm lượng ±5%</span>
            <kbd>M</kbd><span>Tắt / Bật tiếng</span>
            <kbd>L</kbd><span>Bật / Tắt lặp</span>
            <kbd>{'< >'}</kbd><span>Giảm / Tăng tốc độ</span>
            <kbd>F / Esc</kbd><span>Mở / Đóng màn hình này</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Presentational sub-components ───────────────────────────────────────────

interface SkipButtonProps {
  seconds: number;
  direction: 'back' | 'forward';
  onClick: () => void;
  title: string;
}

function SkipButton({ seconds, direction, onClick, title }: SkipButtonProps) {
  return (
    <button className="player-modal__skip-btn" onClick={onClick} title={title}>
      <div className="player-modal__skip-icon">
        {direction === 'back' ? <SkipBackIcon /> : <SkipForwardIcon />}
        <span className="player-modal__skip-seconds">{seconds}</span>
      </div>
    </button>
  );
}

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-.49-3.51" />
    </svg>
  );
}

function LoopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function VolumeMuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
