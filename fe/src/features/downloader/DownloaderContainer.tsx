import { useState, useEffect } from 'react';
import { useYouTubeDownload } from './useYouTubeDownload';
import { useQueryClient } from '@tanstack/react-query';
import { TRACKS_QUERY_KEY } from '../tracks/hooks';
import { api } from '../../lib/api';
import type { Track } from '../../types/database';
import type { VideoPreview } from '../../lib/api';

const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/;

export function DownloaderContainer() {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = (track: Track) => {
    queryClient.setQueryData<Track[]>(TRACKS_QUERY_KEY, (old = []) => [track, ...old]);
    setUrl('');
    setPreview(null);
  };

  const { state, download } = useYouTubeDownload(handleSuccess);

  useEffect(() => {
    const trimmed = url.trim();
    if (!YOUTUBE_URL_PATTERN.test(trimmed)) {
      setPreview(null);
      setIsLoadingPreview(false);
      return;
    }
    setIsLoadingPreview(true);
    setPreview(null);
    const timer = setTimeout(async () => {
      try {
        const result = await api.getPreview(trimmed);
        setPreview(result);
      } catch {
        setPreview(null);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isDownloading) return;
    const trimmedUrl = url.trim();
    if (!YOUTUBE_URL_PATTERN.test(trimmedUrl)) {
      setUrlError('Vui lòng nhập đường link YouTube hợp lệ');
      return;
    }
    setUrlError(null);
    download(trimmedUrl);
  };

  return (
    <div className="downloader">
      <form className="downloader__form" onSubmit={handleSubmit}>
        <div className="downloader__input-wrap">
          <span className="downloader__icon">🔗</span>
          <input
            className={`downloader__input${urlError ? ' downloader__input--error' : ''}`}
            type="url"
            placeholder="Dán link YouTube vào đây..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
            disabled={state.isDownloading}
            aria-label="YouTube URL"
          />
        </div>
        <button
          className="downloader__btn"
          type="submit"
          disabled={state.isDownloading || !url.trim()}
        >
          {state.isDownloading ? (
            <span className="downloader__btn-loading">
              <span className="downloader__spinner" />
              Đang tải...
            </span>
          ) : (
            '↓ Tải về'
          )}
        </button>
      </form>

      {urlError && <p className="downloader__field-error">{urlError}</p>}

      {(isLoadingPreview || preview) && (
        <div className={`downloader__preview${state.isDownloading ? ' downloader__preview--downloading' : ''}`}>
          {isLoadingPreview ? (
            <div className="downloader__preview-skeleton">
              <div className="downloader__preview-thumb-skeleton" />
              <div className="downloader__preview-info-skeleton">
                <div className="skeleton-line skeleton-line--lg" />
                <div className="skeleton-line skeleton-line--sm" />
              </div>
            </div>
          ) : preview ? (
            <>
              <img
                className="downloader__preview-thumb"
                src={preview.thumbnailUrl}
                alt={preview.title}
              />
              <div className="downloader__preview-info">
                <p className="downloader__preview-title">{preview.title}</p>
                <p className="downloader__preview-label">
                  {state.isDownloading ? '⏬ Đang tải xuống...' : 'YouTube Video'}
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {state.isDownloading && (
        <DownloadProgressBar progress={state.progress} status={state.status} />
      )}
      {state.error && <p className="downloader__error">{state.error}</p>}
    </div>
  );
}

// ─── Presentational sub-components ────────────────────────────────────────────

interface DownloadProgressBarProps {
  progress: number;
  status: string | null;
}

function DownloadProgressBar({ progress, status }: DownloadProgressBarProps) {
  return (
    <div className="downloader__progress-wrap">
      <div className="downloader__progress">
        <div
          className="downloader__progress-bar"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="downloader__progress-label">
        {status === 'processing' ? '⚙️ Đang xử lý...' : `${Math.round(progress)}%`}
      </span>
    </div>
  );
}
