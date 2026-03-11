import { useEffect, useRef } from 'react';
import type { Track } from '../../types/database';
import type { LyricsData } from './types';
import { useLyrics } from './useLyrics';

interface LyricsPanelProps {
  track: Track;
  currentTime: number;
}

export function LyricsPanel({ track, currentTime }: LyricsPanelProps) {
  const { lyricsData, isLoading, error, currentLineIndex } = useLyrics(track, currentTime);

  return (
    <div className="lyrics-panel">
      <div className="lyrics-panel__header">
        <span className="lyrics-panel__icon">🎤</span>
        <h3 className="lyrics-panel__title">Lời bài hát</h3>
        {lyricsData?.isSynced && (
          <span className="lyrics-panel__badge">Đồng bộ</span>
        )}
      </div>

      <div className="lyrics-panel__body">
        {isLoading && <LyricsLoading />}
        {!isLoading && error && <LyricsError />}
        {!isLoading && !error && !lyricsData && null}
        {!isLoading && !error && lyricsData && (
          <LyricsContent
            lyricsData={lyricsData}
            currentLineIndex={currentLineIndex}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LyricsLoading() {
  return (
    <div className="lyrics-panel__state">
      <div className="lyrics-panel__spinner" />
      <p>Đang tải lời bài hát…</p>
    </div>
  );
}

function LyricsError() {
  return (
    <div className="lyrics-panel__state lyrics-panel__state--empty">
      <div className="lyrics-panel__empty-icon">♪</div>
      <p className="lyrics-panel__empty-text">Không tìm thấy lời bài hát</p>
      <span className="lyrics-panel__empty-sub">
        Thử tìm thủ công hoặc chỉnh sửa tên bài hát
      </span>
    </div>
  );
}

interface LyricsContentProps {
  lyricsData: LyricsData;
  currentLineIndex: number;
}

function LyricsContent({ lyricsData, currentLineIndex }: LyricsContentProps) {
  const activeRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex]);

  if (lyricsData.isSynced && lyricsData.lines.length > 0) {
    return (
      <div className="lyrics-panel__lines">
        {lyricsData.lines.map((line, idx) => {
          const isActive = idx === currentLineIndex;
          const isPast = idx < currentLineIndex;
          return (
            <p
              key={idx}
              ref={isActive ? activeRef : null}
              className={[
                'lyrics-panel__line',
                isActive ? 'lyrics-panel__line--active' : '',
                isPast ? 'lyrics-panel__line--past' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    );
  }

  if (lyricsData.plain) {
    return (
      <div className="lyrics-panel__plain">
        {lyricsData.plain.split('\n').map((line, idx) =>
          line.trim() ? (
            <p key={idx} className="lyrics-panel__plain-line">
              {line}
            </p>
          ) : (
            <br key={idx} />
          )
        )}
      </div>
    );
  }

  return (
    <div className="lyrics-panel__state lyrics-panel__state--empty">
      <div className="lyrics-panel__empty-icon">♪</div>
      <p className="lyrics-panel__empty-text">Không tìm thấy lời bài hát</p>
      <span className="lyrics-panel__empty-sub">Bài hát này chưa có lời</span>
    </div>
  );
}
