import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../lib/api';
import { useDownloadCenterStore } from './downloadCenterStore';
import type { VideoPreview } from '../../lib/api';

const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/;

export function DownloaderContainer() {
  const enqueueDownload = useDownloadCenterStore((state) => state.enqueueDownload);
  const items = useDownloadCenterStore((state) => state.items);
  const activeItem = items.find((item) => item.status === 'downloading' || item.status === 'processing') ?? null;

  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    const trimmed = url.trim();
    if (!YOUTUBE_URL_PATTERN.test(trimmed)) {
      setPreview(null);
      setIsLoadingPreview(false);
      return;
    }

    setIsLoadingPreview(true);
    setPreview(null);

    const timer = window.setTimeout(async () => {
      try {
        const result = await api.getPreview(trimmed);
        setPreview(result);
      } catch {
        setPreview(null);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [url]);

  const queueCount = useMemo(
    () => items.filter((item) => item.status === 'queued').length,
    [items],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedUrl = url.trim();

    if (!YOUTUBE_URL_PATTERN.test(trimmedUrl)) {
      setUrlError('Vui lòng nhập đường link YouTube hợp lệ.');
      return;
    }

    enqueueDownload(trimmedUrl);
    setUrl('');
    setPreview(null);
    setUrlError(null);
  };

  return (
    <div className="downloader">
      <form className="downloader__form" onSubmit={handleSubmit}>
        <div className="downloader__input-wrap">
          <span className="downloader__icon">↗</span>
          <input
            className={`downloader__input${urlError ? ' downloader__input--error' : ''}`}
            type="url"
            placeholder="Dán link YouTube để thêm vào hàng đợi tải..."
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError(null);
            }}
            aria-label="YouTube URL"
          />
        </div>
        <button className="downloader__btn" type="submit" disabled={!url.trim()}>
          Thêm vào hàng đợi
        </button>
      </form>

      {urlError ? <p className="downloader__field-error">{urlError}</p> : null}

      {(isLoadingPreview || preview) ? (
        <div className={`downloader__preview${activeItem ? ' downloader__preview--downloading' : ''}`}>
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
              <img className="downloader__preview-thumb" src={preview.thumbnailUrl} alt={preview.title} />
              <div className="downloader__preview-info">
                <p className="downloader__preview-title">{preview.title}</p>
                <p className="downloader__preview-label">
                  {activeItem ? `Đang xử lý • còn ${queueCount} mục chờ` : 'Sẵn sàng tải xuống'}
                </p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {activeItem ? (
        <div className="downloader__progress-wrap">
          <div className="downloader__progress">
            <div
              className="downloader__progress-bar"
              style={{ width: `${activeItem.progress}%` }}
              role="progressbar"
              aria-valuenow={activeItem.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="downloader__progress-label">
            {activeItem.status === 'processing'
              ? 'Đang xử lý file...'
              : `${Math.round(activeItem.progress)}% • ${queueCount} mục đang chờ`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
