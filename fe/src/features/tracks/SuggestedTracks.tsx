import { memo, useMemo } from 'react';
import type { Track } from '../../types/database';
import { getTopTrackIds, getPlayCount } from './useListeningHistory';

interface SuggestedTracksProps {
  tracks: Track[];
  currentTrackId?: string;
  historyVersion: number;
  onPlay: (track: Track) => void;
}

export const SuggestedTracks = memo(function SuggestedTracks({
  tracks,
  currentTrackId,
  historyVersion,
  onPlay,
}: SuggestedTracksProps) {
  const topIds = useMemo(() => getTopTrackIds(10), [historyVersion]);

  const suggested = useMemo(() => {
    if (topIds.length === 0) return [];

    const trackMap = new Map(tracks.map((track) => [track.id, track]));
    return topIds
      .map((id) => trackMap.get(id))
      .filter((track): track is Track => track !== undefined)
      .slice(0, 8);
  }, [topIds, tracks]);

  if (suggested.length === 0) return null;

  return (
    <section className="track-suggestions">
      <h3 className="track-suggestions__title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Nghe thÆ°á»ng xuyÃªn
      </h3>
      <ul className="track-suggestions__list">
        {suggested.map((track) => (
          <SuggestionItem
            key={track.id}
            track={track}
            playCount={getPlayCount(track.id)}
            isActive={track.id === currentTrackId}
            onPlay={() => onPlay(track)}
          />
        ))}
      </ul>
    </section>
  );
});

function SuggestionItem({
  track,
  playCount,
  isActive,
  onPlay,
}: {
  track: Track;
  playCount: number;
  isActive: boolean;
  onPlay: () => void;
}) {
  return (
    <li
      className={`suggestion-item${isActive ? ' suggestion-item--active' : ''}`}
      onClick={onPlay}
      title={`ÄÃ£ nghe ${playCount} láº§n â€“ nháº¥n Ä‘á»ƒ phÃ¡t`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPlay()}
    >
      <div className="suggestion-item__thumb">
        {track.thumbnail_url ? (
          <img src={track.thumbnail_url} alt={track.title} loading="lazy" />
        ) : (
          <span>ðŸŽµ</span>
        )}
      </div>
      <div className="suggestion-item__info">
        <p className="suggestion-item__title">{track.title}</p>
        {track.artist && <p className="suggestion-item__artist">{track.artist}</p>}
      </div>
      <span className="suggestion-item__count" aria-label={`${playCount} láº§n`}>
        {playCount}Ã—
      </span>
    </li>
  );
}
