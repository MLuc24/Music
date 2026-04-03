import { useToastStore } from './toastStore';

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone ?? 'default'}`}>
          <div className="toast__content">
            <p className="toast__title">{toast.title}</p>
            {toast.description ? <p className="toast__description">{toast.description}</p> : null}
          </div>
          <div className="toast__actions">
            {toast.actionLabel && toast.onAction ? (
              <button
                className="toast__action"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <button className="toast__close" onClick={() => dismissToast(toast.id)} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
