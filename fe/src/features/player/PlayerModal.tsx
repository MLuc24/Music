import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayerStore } from './playerStore';
import { LyricsPanel } from '../lyrics/LyricsPanel';
import { useTracks } from '../tracks/hooks';
import { useToggleFavorite } from '../tracks/hooks';
import { useToastStore } from '../ui/toastStore';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SHORTCUTS = [
  ['Space / K', 'Phát hoặc tạm dừng'],
  ['← / →', 'Tua 5 giây'],
  ['Shift + ← / →', 'Tua 30 giây'],
  ['↑ / ↓', 'Âm lượng'],
  ['M', 'Tắt hoặc bật tiếng'],
  ['L', 'Lặp lại'],
  ['< / >', 'Đổi tốc độ phát'],
  ['F / Esc', 'Mở hoặc đóng chi tiết'],
];

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
}

interface PlayerModalProps {
  seek: (time: number) => void;
}

export function PlayerModal({ seek }: PlayerModalProps) {
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement | null>(null);
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
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const playNextFromQueue = usePlayerStore((state) => state.playNextFromQueue);
  const updateCurrentTrack = usePlayerStore((state) => state.updateCurrentTrack);
  const showToast = useToastStore((state) => state.showToast);
  const toggleFavoriteMutation = useToggleFavorite();
  const { data: tracks } = useTracks({ limit: 20, sort: 'newest' });

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const upNext = useMemo(() => (isQueueExpanded ? queue : queue.slice(0, 1)), [isQueueExpanded, queue]);
  const suggestedTracks = useMemo(
    () => (tracks ?? []).filter((track) => track.id !== currentTrack?.id).slice(0, 3),
    [currentTrack?.id, tracks],
  );

  useEffect(() => {
    if (!isShortcutOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (shortcutsRef.current?.contains(event.target as Node)) return;
      setIsShortcutOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isShortcutOpen]);

  if (!currentTrack) return null;

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate(currentTrack.id, {
      onSuccess: (updated) => {
        updateCurrentTrack(updated);
        showToast({
          title: updated.is_favorite ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích',
          description: updated.title,
          tone: 'success',
        });
      },
      onError: () => {
        showToast({
          title: 'Không thể cập nhật yêu thích',
          description: currentTrack.title,
          tone: 'error',
        });
      },
    });
  };

  const handleAddToQueue = () => {
    const candidates = suggestedTracks.filter((track) => !queue.some((item) => item.track.id === track.id));
    if (candidates.length === 0) {
      showToast({ title: 'Chưa có bài phù hợp để thêm', description: 'Nghe thêm vài bài để hệ thống có gợi ý.', tone: 'default' });
      return;
    }

    addToQueue(candidates, 'end');
    showToast({ title: 'Đã thêm gợi ý vào hàng chờ', description: `${candidates.length} bài hát`, tone: 'success' });
  };

  const handlePlaySuggested = () => {
    const nextTrack = suggestedTracks[0];
    if (nextTrack) {
      void playTrack(nextTrack);
    }
  };

  return (
    <div className="player-modal player-detail" role="dialog" aria-modal="true" aria-label="Chi tiết bài hát">
      <div
        className="player-modal__ambient"
        style={{ backgroundImage: currentTrack.thumbnail_url ? `url(${currentTrack.thumbnail_url})` : undefined }}
      />

      <div className="player-modal__inner">
        <div className="player-modal__panel player-modal__panel--player">
          <header className="player-modal__header">
            <button className="player-modal__back" onClick={() => setIsModalOpen(false)} aria-label="Quay lại">
              <span aria-hidden="true">‹</span>
              Quay lại
            </button>
            <span className="player-modal__now-playing">Đang phát</span>
            <div className="player-modal__header-actions">
              <button
                className={`player-modal__round-btn${currentTrack.is_favorite ? ' player-modal__round-btn--active' : ''}`}
                type="button"
                onClick={handleToggleFavorite}
                disabled={toggleFavoriteMutation.isPending}
                aria-label={currentTrack.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              >
                ♥
              </button>
              <div className="player-modal__shortcuts-area" ref={shortcutsRef}>
                <button
                  className={`player-modal__round-btn${isShortcutOpen ? ' player-modal__round-btn--active' : ''}`}
                  type="button"
                  aria-label="Phím tắt"
                  aria-expanded={isShortcutOpen}
                  onClick={() => setIsShortcutOpen((open) => !open)}
                >
                  ⋯
                </button>
                {isShortcutOpen ? (
                  <div className="player-modal__shortcut-popover" role="dialog" aria-label="Hướng dẫn phím tắt">
                    <p className="player-modal__shortcut-title">Phím tắt trình phát</p>
                    <div className="player-modal__shortcut-card">
                      {SHORTCUTS.map(([key, label]) => (
                        <div className="player-modal__shortcut-row" key={key}>
                          <kbd>{key}</kbd>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="player-modal__artwork-section">
            <div className="player-modal__wave player-modal__wave--left" aria-hidden="true">
              {Array.from({ length: 28 }, (_, index) => <span key={index} />)}
            </div>
            <div className={`player-modal__disc${isPlaying ? ' player-modal__disc--spinning' : ''}`}>
              {currentTrack.thumbnail_url ? (
                <img className="player-modal__artwork" src={currentTrack.thumbnail_url} alt={currentTrack.title} />
              ) : (
                <div className="player-modal__artwork player-modal__artwork--placeholder">♫</div>
              )}
              <div className="player-modal__disc-shadow" />
              <div className="player-modal__disc-hole" />
            </div>
            <div className="player-modal__wave player-modal__wave--right" aria-hidden="true">
              {Array.from({ length: 28 }, (_, index) => <span key={index} />)}
            </div>
          </div>

          <div className="player-modal__track-info">
            <h2 className="player-modal__title">{currentTrack.title}</h2>
            {currentTrack.artist ? <p className="player-modal__artist">{currentTrack.artist}</p> : null}
            <div className="player-modal__stats" aria-label="Thống kê bài hát">
              <span><span aria-hidden="true">▷</span> 1.2M</span>
              <span><span aria-hidden="true">♡</span> 32K</span>
              <button type="button" onClick={handleAddToQueue} aria-label="Thêm gợi ý vào hàng chờ">+</button>
            </div>
          </div>

          <div className="player-modal__progress">
            <div className="player-modal__time-row">
              <span className="player-modal__time">{formatTime(currentTime)}</span>
              <span className="player-modal__time">{formatTime(duration || currentTrack.duration_seconds || 0)}</span>
            </div>
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
          </div>

          <div className="player-modal__controls">
            <button className="player-modal__skip-btn" type="button" onClick={handlePlaySuggested} aria-label="Phát gợi ý">
              ⤨
            </button>
            <button className="player-modal__skip-btn" onClick={() => seek(Math.max(0, currentTime - 10))} aria-label="Lùi 10 giây">
              ◀
            </button>
            <button
              className="player-modal__play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? 'Ⅱ' : '▶'}
            </button>
            <button className="player-modal__skip-btn" onClick={() => void playNextFromQueue()} aria-label="Bài tiếp trong hàng chờ">
              ▶
            </button>
            <button
              className={`player-modal__skip-btn${isLooping ? ' player-modal__skip-btn--active' : ''}`}
              onClick={() => setIsLooping(!isLooping)}
              aria-label="Lặp lại"
            >
              ↻
            </button>
          </div>

          <div className="player-modal__secondary">
            <span className="player-modal__field-label">Tốc độ phát</span>
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
            <button className="player-modal__icon-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.8)} aria-label={volume === 0 ? 'Bật âm' : 'Tắt tiếng'}>
              {volume === 0 ? '🔇' : '🔈'}
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
            <span className="player-modal__volume-icon" aria-hidden="true">🔊</span>
          </div>

          <section className={`player-modal__queue${isQueueExpanded ? ' player-modal__queue--expanded' : ''}`}>
            <div className="player-modal__queue-header">
              <h3><span aria-hidden="true">☷</span> Tiếp theo</h3>
              <button type="button" onClick={() => setIsQueueExpanded((expanded) => !expanded)}>
                {isQueueExpanded ? 'Thu gọn' : 'Xem danh sách'}
              </button>
            </div>
            {upNext.length === 0 ? (
              <p className="player-modal__queue-empty">
                Chưa có bài nào trong hàng chờ.
              </p>
            ) : (
              <ul className="player-modal__queue-list">
                {upNext.map((item) => (
                  <li key={item.id} className="player-modal__queue-item">
                    <button className="player-modal__queue-main" onClick={() => void playTrack(item.track)}>
                      {item.track.thumbnail_url ? <img src={item.track.thumbnail_url} alt="" loading="lazy" /> : <span aria-hidden="true">♫</span>}
                      <span>{item.track.title}</span>
                      {item.track.artist ? <small>{item.track.artist}</small> : null}
                    </button>
                    <button
                      className="player-modal__queue-remove"
                      onClick={() => removeFromQueue(item.track.id)}
                      aria-label="Bỏ khỏi queue"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {queue.length > 0 ? (
              <button className="player-modal__queue-clear" type="button" onClick={clearQueue}>
                Xóa hàng chờ
              </button>
            ) : null}
          </section>
        </div>

        <div className="player-modal__side">
          <div className="player-modal__panel player-modal__panel--lyrics">
            <LyricsPanel track={currentTrack} currentTime={currentTime} />
          </div>

          <section className="player-modal__suggested">
            <div className="player-modal__suggested-header">
              <h3>Có thể bạn sẽ thích</h3>
              <button type="button">Xem tất cả</button>
            </div>
            <div className="player-modal__suggested-list">
              {suggestedTracks.length ? (
                suggestedTracks.map((track) => (
                  <button key={track.id} className="player-modal__suggested-card" type="button" onClick={() => void playTrack(track)}>
                    {track.thumbnail_url ? <img src={track.thumbnail_url} alt="" loading="lazy" /> : <span className="player-modal__suggested-thumb">♫</span>}
                    <span className="player-modal__suggested-copy">
                      <strong>{track.title}</strong>
                      {track.artist ? <small>{track.artist}</small> : null}
                    </span>
                    <span className="player-modal__suggested-play" aria-hidden="true">▶</span>
                  </button>
                ))
              ) : (
                <p className="player-modal__suggested-empty">Thêm vài bài hát để nhận gợi ý phù hợp.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
