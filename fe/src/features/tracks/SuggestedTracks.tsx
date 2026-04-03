import { memo } from 'react';
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
  void historyVersion;

  const topIds = getTopTrackIds(10);
  const trackMap = new Map(tracks.map((track) => [track.id, track]));
  const suggested = topIds
    .map((id) => trackMap.get(id))
    .filter((track): track is Track => track !== undefined)
    .slice(0, 8);

  if (suggested.length === 0) return null;

  return (
    <section className="track-suggestions">
      <h3 className="track-suggestions__title">Nghe thường xuyên</h3>
      <ul className="track-suggestions__list">
        {suggested.map((track) => (
          <li
            key={track.id}
            className={`suggestion-item${track.id === currentTrackId ? ' suggestion-item--active' : ''}`}
            onClick={() => onPlay(track)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onPlay(track);
            }}
          >
            <div className="suggestion-item__thumb">
              {track.thumbnail_url ? <img src={track.thumbnail_url} alt={track.title} loading="lazy" /> : <span>🎵</span>}
            </div>
            <div className="suggestion-item__info">
              <p className="suggestion-item__title">{track.title}</p>
              {track.artist ? <p className="suggestion-item__artist">{track.artist}</p> : null}
            </div>
            <span className="suggestion-item__count" aria-label={`${getPlayCount(track.id)} lần`}>
              {getPlayCount(track.id)}x
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});
