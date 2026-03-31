import { useState, useEffect } from "react";
import { API, tg } from "@/components/miniapp/types";
import type { User } from "@/components/miniapp/types";
import ChildView from "@/components/miniapp/ChildView";
import ParentView from "@/components/miniapp/ParentView";

export default function MiniApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const webapp = tg();
    if (webapp) {
      webapp.ready();
      webapp.expand();
    }

    const auth = async () => {
      try {
        const initData = webapp?.initData || "";
        const tgId = webapp?.initDataUnsafe?.user?.id;
        const body: Record<string, unknown> = { initData };
        if (!initData && tgId) body.telegram_id = tgId;

        const r = await fetch(`${API}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (data.error) {
          setError(data.error);
        } else {
          setUser(data);
        }
      } catch (e) {
        setError("Не удалось подключиться к серверу");
      } finally {
        setLoading(false);
      }
    };

    auth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div className="text-5xl mb-4 animate-float">⭐</div>
        <p className="text-white font-semibold text-lg">СтарКидс</p>
        <p className="text-white/60 text-sm mt-1">Загружаем...</p>
        <div className="mt-6 w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user || user.role === "unknown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <p className="text-5xl mb-4">😕</p>
        <p className="text-white font-bold text-xl mb-2">Не распознан</p>
        <p className="text-white/70 text-sm">Зайди через Telegram-бот СтарКидс</p>
        {error && <p className="text-red-300 text-xs mt-3">{error}</p>}
      </div>
    );
  }

  if (user.role === "child") return <ChildView user={user} />;
  if (user.role === "parent") return <ParentView user={user} />;
  return null;
}
