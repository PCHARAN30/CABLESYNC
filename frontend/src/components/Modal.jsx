import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 pt-8 sm:pt-0"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:max-w-xl lg:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-lg max-h-[72vh] sm:max-h-[65vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline sticky top-0 bg-card">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-soft hover:text-ink text-sm font-medium leading-none px-3 py-1 rounded-md border border-transparent hover:border-hairline"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
