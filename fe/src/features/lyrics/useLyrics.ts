import { useState, useEffect, useMemo } from 'react';
import type { Track } from '../../types/database';
import type { LyricsData } from './types';
import { getLyricsForTrack } from './api';

interface UseLyricsResult {
  lyricsData: LyricsData | null;
  isLoading: boolean;
  error: string | null;
  currentLineIndex: number;
}

export function useLyrics(track: Track, currentTime: number): UseLyricsResult {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLyricsForTrack(track.title, track.artist ?? undefined)
      .then((data) => {
        if (!cancelled) {
          setLyricsData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không thể tải lời bài hát');
          setIsLoading(false);
        }
      });

    setIsLoading(true);
    setError(null);
    setLyricsData(null);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  const currentLineIndex = useMemo(() => {
    if (!lyricsData?.isSynced || lyricsData.lines.length === 0) return -1;

    let idx = -1;
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (lyricsData.lines[i].time <= currentTime) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData, currentTime]);

  return { lyricsData, isLoading, error, currentLineIndex };
}

