declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: { user?: { id: number; first_name: string }; start_param?: string };
        ready: () => void;
        expand: () => void;
        close: () => void;
        BackButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => void };
        MainButton: { show: () => void; hide: () => void; setText: (t: string) => void; onClick: (fn: () => void) => void; showProgress: () => void; hideProgress: () => void };
        HapticFeedback: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void };
        colorScheme: string;
      };
    };
  }
}

export const tg = () => window.Telegram?.WebApp;