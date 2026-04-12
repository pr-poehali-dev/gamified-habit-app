import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Уже установлено как PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Telegram WebView — не показываем
    if (window.Telegram?.WebApp?.initData) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] flex items-center justify-center text-2xl shrink-0">
          ⭐
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1E1B4B] text-sm">Добавить на экран</p>
          <p className="text-xs text-gray-400 truncate">Быстрый доступ без браузера</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setVisible(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 bg-gray-50"
          >
            Не сейчас
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF]"
          >
            Установить
          </button>
        </div>
      </div>
    </div>
  );
}
