import { useToasts } from "../hooks/useToasts";
import Toast from "../pages/Toast";

export default function ToastContainer() {
  const { toasts, dismissToast } = useToasts();

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}