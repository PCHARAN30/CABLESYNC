import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function CustomerFormModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="customer-form-overlay">
      <div
        className="customer-form-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* HEADER */}
        <header className="customer-form-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="customer-form-close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="customer-form-body">
          {children}
        </main>

        {/* STICKY FOOTER */}
        {footer && (
          <footer className="customer-form-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}