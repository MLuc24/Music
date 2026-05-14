import { useEffect, useRef, useState } from 'react';
import type { Track } from '../../types/database';
import type { LyricsData } from './types';
import { useLyrics } from './useLyrics';

interface LyricsPanelProps {
  track: Track;
  currentTime: number;
}

export function LyricsPanel({ track, currentTime }: LyricsPanelProps) {
  const { lyricsData, isLoading, error, currentLineIndex } = useLyrics(track, currentTime);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'info'>('lyrics');

  return (
    <div className="lyrics-panel">
      <div className="lyrics-panel__header">
        <button
          className={`lyrics-panel__tab${activeTab === 'lyrics' ? ' lyrics-panel__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('lyrics')}
        >
          <span aria-hidden="true">♬</span>
          Lời bài hát
          {lyricsData?.isSynced ? <em>Đồng bộ</em> : null}
        </button>
        <button
          className={`lyrics-panel__tab${activeTab === 'info' ? ' lyrics-panel__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('info')}
        >
          <span aria-hidden="true">ⓘ</span>
          Thông tin
        </button>
      </div>

      <div className="lyrics-panel__body">
        {activeTab === 'lyrics' ? (
          <>
            {isLoading && <LyricsLoading />}
            {!isLoading && error && <LyricsError />}
            {!isLoading && !error && !lyricsData && <LyricsEmpty />}
            {!isLoading && !error && lyricsData && (
              <LyricsContent
                lyricsData={lyricsData}
                currentLineIndex={currentLineIndex}
              />
            )}
          </>
        ) : (
          <TrackInfo track={track} />
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
        Lời bài hát hiện chưa có sẵn cho bài hát này. Bạn có thể thử lại sau hoặc đóng góp lời bài hát.
      </span>
      <button className="lyrics-panel__contribute" type="button">
        <span aria-hidden="true">♬</span> Đóng góp lời bài hát
      </button>
    </div>
  );
}

function LyricsEmpty() {
  return (
    <div className="lyrics-panel__state lyrics-panel__state--empty">
      <div className="lyrics-panel__empty-icon">♪</div>
      <p className="lyrics-panel__empty-text">Không tìm thấy lời bài hát</p>
      <span className="lyrics-panel__empty-sub">
        Lời bài hát hiện chưa có sẵn cho bài hát này. Bạn có thể thử lại sau hoặc đóng góp lời bài hát.
      </span>
      <button className="lyrics-panel__contribute" type="button">
        <span aria-hidden="true">♬</span> Đóng góp lời bài hát
      </button>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Không rõ';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function TrackInfo({ track }: { track: Track }) {
  const rows = [
    ['Tên bài hát', track.title],
    ['Nghệ sĩ', track.artist || 'Không rõ'],
    ['Thời lượng', formatDuration(track.duration_seconds)],
    ['Ngày thêm', formatDate(track.created_at)],
    ['Trạng thái', track.is_favorite ? 'Đã yêu thích' : 'Chưa yêu thích'],
  ];

  return (
    <div className="lyrics-panel__info">
      {track.thumbnail_url ? <img className="lyrics-panel__info-cover" src={track.thumbnail_url} alt="" loading="lazy" /> : null}
      <div className="lyrics-panel__info-list">
        {rows.map(([label, value]) => (
          <div className="lyrics-panel__info-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
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
      <span className="lyrics-panel__empty-sub">Lời bài hát hiện chưa có sẵn cho bài hát này.</span>
      <button className="lyrics-panel__contribute" type="button">
        <span aria-hidden="true">♬</span> Đóng góp lời bài hát
      </button>
    </div>
  );
}
