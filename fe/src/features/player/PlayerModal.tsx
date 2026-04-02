import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from './playerStore';
import { LyricsPanel } from '../lyrics/LyricsPanel';
import { useTracks } from '../tracks/hooks';
import { tracksApi } from '../tracks/api';
import { recordPlay } from '../tracks/useListeningHistory';
import { SuggestedTracks } from '../tracks/SuggestedTracks';
import type { Track } from '../../types/database';

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
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const isLooping = usePlayerStore((state) => state.isLooping);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setIsLooping = usePlayerStore((state) => state.setIsLooping);
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate);
  const setIsModalOpen = usePlayerStore((state) => state.setIsModalOpen);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const { data: tracks } = useTracks();
  const [historyVersion, setHistoryVersion] = useState(0);
  const previousTrackIdRef = useRef<string | undefined>(currentTrack?.id);
  const [ambient, setAmbient] = useState<{ a: string | null; b: string | null; top: 'a' | 'b' }>({
    a: currentTrack?.thumbnail_url ?? null,
    b: null,
    top: 'a',
  });

  useEffect(() => {
    if (previousTrackIdRef.current === currentTrack?.id) return;

    previousTrackIdRef.current = currentTrack?.id;
    const url = currentTrack?.thumbnail_url ?? null;
    setAmbient((prev) =>
      prev.top === 'a' ? { ...prev, b: url, top: 'b' } : { ...prev, a: url, top: 'a' },
    );
  }, [currentTrack?.id, currentTrack?.thumbnail_url]);

  const handlePlaySuggestion = useCallback(async (track: Track) => {
    try {
      const streamUrl = await tracksApi.getStreamUrl(track.storage_path);
      setCurrentTrack(track, streamUrl);
      recordPlay(track.id);
      setHistoryVersion((version) => version + 1);
    } catch (error) {
      console.error('Failed to play suggested track:', track.id, track.storage_path, error);
    }
  }, [setCurrentTrack]);

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-modal" role="dialog" aria-modal="true" aria-label="TrÃ¬nh phÃ¡t Ä‘áº§y Ä‘á»§">
      <div
        className="player-modal__ambient"
        style={{ backgroundImage: ambient.a ? `url(${ambient.a})` : undefined, opacity: ambient.top === 'a' ? 1 : 0 }}
      />
      <div
        className="player-modal__ambient"
        style={{ backgroundImage: ambient.b ? `url(${ambient.b})` : undefined, opacity: ambient.top === 'b' ? 1 : 0 }}
      />

      <div className="player-modal__inner">
        <div className="player-modal__panel player-modal__panel--player">
          <header className="player-modal__header">
            <button
              className="player-modal__icon-btn"
              onClick={() => setIsModalOpen(false)}
              aria-label="Thu gá»n"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <p className="player-modal__now-playing">Äang phÃ¡t</p>
            <div className="player-modal__shortcuts-area">
              <button className="player-modal__shortcuts-btn" aria-label="PhÃ­m táº¯t" title="PhÃ­m táº¯t">
                ?
              </button>
              <div className="player-modal__shortcuts-popup">
                <div className="player-modal__shortcuts-grid">
                  <kbd>0 â€“ 9</kbd><span>Tua Ä‘áº¿n 0% â€“ 90%</span>
                  <kbd>Space / K</kbd><span>PhÃ¡t / Dá»«ng</span>
                  <kbd>â† â†’</kbd><span>Â±5 giÃ¢y</span>
                  <kbd>Shift + â† â†’</kbd><span>Â±30 giÃ¢y</span>
                  <kbd>â†‘ â†“</kbd><span>Ã‚m lÆ°á»£ng Â±5%</span>
                  <kbd>M</kbd><span>Táº¯t / Báº­t tiáº¿ng</span>
                  <kbd>L</kbd><span>Báº­t / Táº¯t láº·p</span>
                  <kbd>{'< >'}</kbd><span>Giáº£m / TÄƒng tá»‘c Ä‘á»™</span>
                  <kbd>F / Esc</kbd><span>Má»Ÿ / ÄÃ³ng mÃ n hÃ¬nh nÃ y</span>
                </div>
              </div>
            </div>
          </header>

          <div key={currentTrack.id} className="player-modal__artwork-section">
            <div className={`player-modal__disc${isPlaying ? ' player-modal__disc--spinning' : ''}`}>
              {currentTrack.thumbnail_url ? (
                <img
                  className="player-modal__artwork"
                  src={currentTrack.thumbnail_url}
                  alt={currentTrack.title}
                />
              ) : (
                <div className="player-modal__artwork player-modal__artwork--placeholder">ðŸŽµ</div>
              )}
              <div className="player-modal__disc-shadow" />
              <div className="player-modal__disc-hole" />
            </div>
          </div>

          <div key={`info-${currentTrack.id}`} className="player-modal__track-info">
            <h2 className="player-modal__title">{currentTrack.title}</h2>
            {currentTrack.artist && <p className="player-modal__artist">{currentTrack.artist}</p>}
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
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Tua nháº¡c"
              />
            </div>

            <div className="player-modal__markers" aria-hidden="true">
              {[{ pct: 25, label: 'Â¼' }, { pct: 50, label: 'Â½' }, { pct: 75, label: 'Â¾' }].map(({ pct, label }) => (
                <button
                  key={pct}
                  className="player-modal__marker"
                  style={{ left: `${pct}%` }}
                  onClick={() => seek((duration * pct) / 100)}
                  title={`Tua Ä‘áº¿n ${pct}% (phÃ­m ${pct / 10})`}
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

          <div className="player-modal__controls">
            <SkipButton
              seconds={30}
              direction="back"
              onClick={() => seek(Math.max(0, currentTime - 30))}
              title="LÃ¹i 30 giÃ¢y (Shift+â†)"
            />
            <SkipButton
              seconds={10}
              direction="back"
              onClick={() => seek(Math.max(0, currentTime - 10))}
              title="LÃ¹i 10 giÃ¢y (â†)"
            />
            <button
              className="player-modal__play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Táº¡m dá»«ng' : 'PhÃ¡t'}
            >
              {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
            </button>
            <SkipButton
              seconds={10}
              direction="forward"
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              title="Tiáº¿n 10 giÃ¢y (â†’)"
            />
            <SkipButton
              seconds={30}
              direction="forward"
              onClick={() => seek(Math.min(duration, currentTime + 30))}
              title="Tiáº¿n 30 giÃ¢y (Shift+â†’)"
            />
          </div>

          <div className="player-modal__secondary">
            <button
              className={`player-modal__loop-btn${isLooping ? ' player-modal__loop-btn--active' : ''}`}
              onClick={() => setIsLooping(!isLooping)}
              title="Láº·p láº¡i (L)"
              aria-pressed={isLooping}
            >
              <LoopIcon />
              <span>Láº·p</span>
            </button>

            <div className="player-modal__speed-group" role="group" aria-label="Tá»‘c Ä‘á»™ phÃ¡t">
              {RATES.map((r) => (
                <button
                  key={r}
                  className={`player-modal__speed-btn${playbackRate === r ? ' player-modal__speed-btn--active' : ''}`}
                  onClick={() => setPlaybackRate(r)}
                  title={`Tá»‘c Ä‘á»™ ${r}x (phÃ­m < >)`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          <div className="player-modal__volume">
            <button
              className="player-modal__icon-btn"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              aria-label={volume === 0 ? 'Báº­t Ã¢m' : 'Táº¯t tiáº¿ng'}
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
                aria-label="Ã‚m lÆ°á»£ng"
              />
            </div>
          </div>

          <SuggestedTracks
            tracks={tracks ?? []}
            currentTrackId={currentTrack.id}
            historyVersion={historyVersion}
            onPlay={handlePlaySuggestion}
          />
        </div>

        <div className="player-modal__panel player-modal__panel--lyrics">
          <LyricsPanel track={currentTrack} currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}

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
