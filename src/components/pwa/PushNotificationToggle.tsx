import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  parentId?: number;
  childId?: number;
  autoSubscribe?: boolean;
}

export default function PushNotificationToggle({ parentId, childId, autoSubscribe = false }: Props) {
  const { status, isSubscribed, isSupported, checking, subscribe, unsubscribe } = usePushNotifications({ parentId, childId });
  const [loading, setLoading] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Автоподписка при первом рендере если разрешение ещё не запрашивалось
  useEffect(() => {
    if (!autoSubscribe || autoTriggered || checking) return;
    if (!isSupported || status === "unsupported" || status === "denied" || isSubscribed) return;
    if (status === "default") {
      setAutoTriggered(true);
      setLoading(true);
      subscribe().finally(() => setLoading(false));
    }
  }, [checking, status, isSubscribed]);

  if (!isSupported || status === "unsupported") return null;
  if (checking) return null;

  const handleToggle = async () => {
    setLoading(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-bold text-[#1E1B4B] text-sm">Push-уведомления</p>
            <p className="text-xs text-gray-400">
              {status === "denied"
                ? "Заблокированы в настройках браузера"
                : isSubscribed
                ? "Включены"
                : loading
                ? "Настраиваем..."
                : "Получайте уведомления о заданиях"}
            </p>
          </div>
        </div>

        {status === "denied" ? (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Заблокированы</span>
        ) : (
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative disabled:opacity-50 ${
              isSubscribed ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF]" : "bg-gray-300"
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-all duration-300 ${isSubscribed ? "left-6" : "left-0.5"}`} />
          </button>
        )}
      </div>

      {status === "denied" && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Чтобы включить: откройте настройки браузера → Уведомления → разрешите для этого сайта
        </p>
      )}
    </div>
  );
}
