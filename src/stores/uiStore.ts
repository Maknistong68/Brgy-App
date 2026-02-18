import { create } from 'zustand';

type Theme = 'light' | 'dark';
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface UIState {
  theme: Theme;
  isOffline: boolean;
  showOfflineBanner: boolean;
  toastMessage: string | null;
  toastType: ToastType | null;
  setTheme: (theme: Theme) => void;
  setOffline: (isOffline: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  isOffline: false,
  showOfflineBanner: false,
  toastMessage: null,
  toastType: null,
  setTheme: (theme) => set({ theme }),
  setOffline: (isOffline) => set({ isOffline, showOfflineBanner: isOffline }),
  showToast: (message, type = 'info') =>
    set({ toastMessage: message, toastType: type }),
  hideToast: () => set({ toastMessage: null, toastType: null }),
}));
