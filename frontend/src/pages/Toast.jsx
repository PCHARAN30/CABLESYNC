import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

const ICONS = {
  success: <CheckCircle className="h-5 w-5 text-paid" />,
  error: <XCircle className="h-5 w-5 text-due" />,
  info: <AlertCircle className="h-5 w-5 text-ink-soft" />,
};

export default function Toast({ message, type = "info", action, onDismiss }) {
  const Icon = ICONS[type] || ICONS.info;

  return (
    <div
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-card shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="shrink-0">{Icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-ink">{message}</p>
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onDismiss();
                }}
                className="mt-1.5 text-sm font-bold text-brass-dark hover:underline"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-3 shrink-0 cursor-pointer text-ink-soft hover:text-ink"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
