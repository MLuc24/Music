import { useDownloadCenterStore } from './downloadCenterStore';

export function DownloadCenterView() {
  const items = useDownloadCenterStore((state) => state.items);
  const retryDownload = useDownloadCenterStore((state) => state.retryDownload);
  const activeCount = items.filter(
    (item) => item.status === 'queued' || item.status === 'downloading' || item.status === 'processing',
  ).length;

  return (
    <section className="download-center">
      <div className="download-center__header">
        <div>
          <p className="download-center__eyebrow">Tải xuống</p>
          <h2>Trung tâm tải</h2>
        </div>
        <span>{activeCount > 0 ? `${activeCount} đang chạy` : `${items.length} mục`}</span>
      </div>

      {items.length === 0 ? (
        <div className="track-list__empty download-center__empty">
          <div className="track-list__empty-icon">↓</div>
          <p className="track-list__empty-title">Chưa có lượt tải nào</p>
          <p className="track-list__empty-sub">
            Dán link YouTube ở phía trên. Tiến trình tải, xử lý và lỗi sẽ hiện tại đây.
          </p>
        </div>
      ) : (
        <ul className="download-center__list">
          {items.map((item) => (
            <li key={item.id} className={`download-card download-card--${item.status}`}>
              <div className="download-card__meta">
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title ?? item.url} /> : <span>↓</span>}
                <div>
                  <p className="download-card__title">{item.title ?? item.url}</p>
                  <span className="download-card__status">
                    {formatStatus(item.status)}
                    {item.duplicate ? ' • đã có sẵn' : ''}
                  </span>
                </div>
              </div>

              <div className="download-card__right">
                <div className="download-card__progress" aria-hidden="true">
                  <div style={{ width: `${item.progress}%` }} />
                </div>
                <span className="download-card__percent">
                  {item.status === 'done' ? 'Xong' : `${Math.round(item.progress)}%`}
                </span>
                {item.status === 'error' ? (
                  <button className="download-card__retry" onClick={() => retryDownload(item.id)}>
                    Thử lại
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case 'queued':
      return 'Đang chờ';
    case 'downloading':
      return 'Đang tải';
    case 'processing':
      return 'Đang xử lý';
    case 'done':
      return 'Hoàn tất';
    case 'error':
      return 'Lỗi';
    default:
      return status;
  }
}
