import { create } from "zustand";

export const useToasts = create((set, get) => ({
  toasts: [],
  // action: optional { label, onClick } — renders a button on the toast
  // (used for "Undo" after a delete). Passing a duration of 0 keeps the
  // toast open until it's dismissed manually or the action is taken.
  addToast: (message, type = "info", duration = 4000, action = null) => {
    const id = Date.now() + Math.random();
    let timeoutId = null;

    if (duration) {
      timeoutId = setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      }, duration);
    }

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, action, timeoutId }],
    }));

    return id;
  },
  dismissToast: (id) => {
    const toast = get().toasts.find((t) => t.id === id);
    if (toast?.timeoutId) clearTimeout(toast.timeoutId);
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));
