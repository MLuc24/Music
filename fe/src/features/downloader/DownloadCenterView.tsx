import { useDownloadCenterStore } from './downloadCenterStore';

export function DownloadCenterView() {
  const items = useDownloadCenterStore((state) => state.items);
  const retryDownload = useDownloadCenterStore((state) => state.retryDownload);

  return (
    <section className="download-center">
      <div className="download-center__header">
        <h2>Download Center</h2>
        <span>{items.length} mục</span>
      </div>

      <ul className="download-center__list">
        {items.map((item) => (
          <li key={item.id} className={`download-card download-card--${item.status}`}>
            <div className="download-card__meta">
              {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title ?? item.url} /> : <span>↓</span>}
              <div>
                <p className="download-card__title">{item.title ?? item.url}</p>
                <span className="download-card__status">
                  {item.status}
                  {item.duplicate ? ' • đã có sẵn' : ''}
                </span>
              </div>
            </div>
            <div className="download-card__right">
              <div className="download-card__progress">
                <div style={{ width: `${item.progress}%` }} />
              </div>
              {item.status === 'error' ? (
                <button onClick={() => retryDownload(item.id)}>Thử lại</button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
