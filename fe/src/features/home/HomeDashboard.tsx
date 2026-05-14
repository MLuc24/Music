import { useMemo } from 'react';
import { useLibrarySummary, useTracks } from '../tracks/hooks';
import { getTopTrackIds } from '../tracks/useListeningHistory';
import { usePlayerStore } from '../player/playerStore';
import { useUIStore } from '../ui/uiStore';
import type { Track } from '../../types/database';

const STAT_SPARKS = [
  [10, 18, 28, 20, 38, 16, 44, 30, 22],
  [6, 14, 24, 34, 18, 42, 28, 20, 12],
  [8, 20, 14, 32, 24, 46, 18, 38, 26],
  [12, 26, 18, 40, 30, 22, 46, 34, 16],
];

const STATS = [
  { key: 'tracks', label: 'Tổng bài hát', icon: '♪', variant: 'violet' },
  { key: 'favorites', label: 'Yêu thích', icon: '♥', variant: 'rose' },
  { key: 'albums', label: 'Album', icon: '●', variant: 'blue' },
  { key: 'recent', label: 'Mới thêm', icon: '+', variant: 'orange' },
] as const;

export function HomeDashboard() {
  const { data: summary, isLoading } = useLibrarySummary();
  const { data: tracks } = useTracks({ limit: 30, sort: 'newest' });
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setActiveView = useUIStore((state) => state.setActiveView);

  const recentAdded = tracks ?? [];
  const frequentTracks = useMemo(() => {
    const topIds = getTopTrackIds(8);
    const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));
    return topIds.map((id) => trackMap.get(id)).filter((track): track is Track => Boolean(track));
  }, [tracks]);

  if (isLoading && !summary) {
    return (
      <div className="home-dashboard home-dashboard--loading">
        <div className="track-list__loading-spinner" />
      </div>
    );
  }

  return (
    <section className="home-dashboard">
      <div className="home-dashboard__hero">
        <div className="home-dashboard__hero-copy">
          <div className="home-dashboard__hero-icon" aria-hidden="true">♫</div>
          <p className="home-dashboard__eyebrow">Tổng quan</p>
          <h2 className="home-dashboard__title">Nghe nhanh, quản lý gọn, không thừa bước.</h2>
          <p className="home-dashboard__subtitle">
            Toàn bộ thư viện nằm cục bộ trên máy, thêm tiện ích ngay trong app thay vì thêm hạ tầng phức tạp.
          </p>
        </div>

        <div className="home-dashboard__art" aria-hidden="true">
          <span className="home-dashboard__note home-dashboard__note--left">♪</span>
          <div className="home-dashboard__headphones">
            <span className="home-dashboard__headband" />
            <span className="home-dashboard__ear home-dashboard__ear--left" />
            <span className="home-dashboard__ear home-dashboard__ear--right" />
          </div>
          <span className="home-dashboard__note home-dashboard__note--right">♪</span>
        </div>
      </div>

      <div className="home-dashboard__stats">
        {STATS.map((stat, index) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={
              stat.key === 'tracks'
                ? summary?.totalTracks ?? 0
                : stat.key === 'favorites'
                  ? summary?.favoriteTracks ?? 0
                  : stat.key === 'albums'
                    ? summary?.totalAlbums ?? 0
                    : summary?.recentTracks.length ?? 0
            }
            icon={stat.icon}
            variant={stat.variant}
            spark={STAT_SPARKS[index]}
          />
        ))}
      </div>

      <div className="home-dashboard__grid">
        <TrackShelf
          title="Mới thêm"
          variant="violet"
          tracks={recentAdded.slice(0, 8)}
          onPlay={(track) => void playTrack(track)}
          onViewAll={() => setActiveView('library')}
        />
        <TrackShelf
          title="Nghe thường xuyên"
          variant="orange"
          tracks={frequentTracks}
          onPlay={(track) => void playTrack(track)}
          emptyTitle="Chưa có dữ liệu"
          emptyDescription="Nghe thêm vài bài hoặc tải nội dung mới để phần này hiện gợi ý."
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
  spark,
}: {
  label: string;
  value: number;
  icon: string;
  variant: 'violet' | 'rose' | 'blue' | 'orange';
  spark: number[];
}) {
  return (
    <article className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__icon" aria-hidden="true">{icon}</div>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
      <div className="stat-card__spark" aria-hidden="true">
        {spark.map((height, index) => (
          <span key={`${label}-${index}`} style={{ height }} />
        ))}
      </div>
    </article>
  );
}

function TrackShelf({
  title,
  variant,
  tracks,
  onPlay,
  onViewAll,
  emptyTitle = 'Chưa có bài hát',
  emptyDescription = 'Dán link YouTube ở phía trên để thêm nội dung vào thư viện.',
}: {
  title: string;
  variant: 'violet' | 'orange';
  tracks: Track[];
  onPlay: (track: Track) => void;
  onViewAll?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <section className={`home-shelf home-shelf--${variant}`}>
      <div className="home-shelf__header">
        <h3><span className="home-shelf__dot" aria-hidden="true" />{title}</h3>
        {onViewAll ? (
          <button className="home-shelf__view-all" type="button" onClick={onViewAll}>
            Xem tất cả <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
      {tracks.length ? (
        <ul className="home-shelf__list">
          {tracks.map((track) => (
            <li key={track.id} className="home-shelf__item">
              {track.thumbnail_url ? (
                <img src={track.thumbnail_url} alt={track.title} loading="lazy" />
              ) : (
                <span className="home-shelf__fallback" aria-hidden="true">♪</span>
              )}
              <div className="home-shelf__item-copy">
                <p>{track.title}</p>
                {track.artist ? <span>{track.artist}</span> : null}
              </div>
              <button className="home-shelf__play" type="button" onClick={() => onPlay(track)} aria-label={`Phát ${track.title}`}>
                ▶
              </button>
              <button className="home-shelf__more" type="button" aria-label={`Tùy chọn cho ${track.title}`}>
                ⋮
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="home-shelf__empty">
          <div className="home-shelf__empty-art" aria-hidden="true">♫</div>
          <div>
            <p className="home-shelf__empty-title">{emptyTitle}</p>
            <p className="home-shelf__empty-sub">{emptyDescription}</p>
          </div>
        </div>
      )}
    </section>
  );
}
