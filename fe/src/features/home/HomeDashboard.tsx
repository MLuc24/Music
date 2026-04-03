import { useMemo } from 'react';
import { useLibrarySummary, useTracks } from '../tracks/hooks';
import { getTopTrackIds } from '../tracks/useListeningHistory';
import { usePlayerStore } from '../player/playerStore';
import type { Track } from '../../types/database';

export function HomeDashboard() {
  const { data: summary, isLoading } = useLibrarySummary();
  const { data: tracks } = useTracks({ limit: 30, sort: 'newest' });
  const playTrack = usePlayerStore((state) => state.playTrack);

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
        <div>
          <p className="home-dashboard__eyebrow">Home</p>
          <h2 className="home-dashboard__title">Nghe nhanh, quản lý gọn, không thừa bước.</h2>
          <p className="home-dashboard__subtitle">
            Toàn bộ thư viện nằm cục bộ trên máy, thêm tiện ích ngay trong app thay vì thêm hạ tầng phức tạp.
          </p>
        </div>
      </div>

      <div className="home-dashboard__stats">
        <StatCard label="Tổng bài hát" value={summary?.totalTracks ?? 0} />
        <StatCard label="Yêu thích" value={summary?.favoriteTracks ?? 0} />
        <StatCard label="Albums" value={summary?.totalAlbums ?? 0} />
        <StatCard label="Mới thêm" value={summary?.recentTracks.length ?? 0} />
      </div>

      <div className="home-dashboard__grid">
        <TrackShelf
          title="Mới thêm"
          tracks={recentAdded.slice(0, 8)}
          onPlay={(track) => void playTrack(track)}
        />
        <TrackShelf
          title="Nghe thường xuyên"
          tracks={frequentTracks}
          onPlay={(track) => void playTrack(track)}
        />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="stat-card">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </article>
  );
}

function TrackShelf({
  title,
  tracks,
  onPlay,
}: {
  title: string;
  tracks: Track[];
  onPlay: (track: Track) => void;
}) {
  return (
    <section className="home-shelf">
      <div className="home-shelf__header">
        <h3>{title}</h3>
      </div>
      <ul className="home-shelf__list">
        {tracks.map((track) => (
          <li key={track.id} className="home-shelf__item" onClick={() => onPlay(track)}>
            {track.thumbnail_url ? <img src={track.thumbnail_url} alt={track.title} loading="lazy" /> : <span>🎵</span>}
            <div>
              <p>{track.title}</p>
              {track.artist ? <span>{track.artist}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
