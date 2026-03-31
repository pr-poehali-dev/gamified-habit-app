import { useState, useEffect, useCallback, useRef } from "react";
import { API, tg, getLevelInfo, getLevelTier, STARS_PER_LEVEL } from "./types";
import type { Task, ShopItem, User } from "./types";
import { XpBar, LevelUpModal, TaskCard } from "./XpBar";

export default function ChildView({ user }: { user: Extract<User, { role: "child" }> }) {
  const [tab, setTab] = useState<"tasks" | "shop">("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [stars, setStars] = useState(user.stars);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef(getLevelInfo(user.stars).level);

  const tid = user.telegram_id;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateStars = useCallback((newStars: number) => {
    const newLevel = getLevelInfo(newStars).level;
    if (newLevel > prevLevelRef.current) {
      setLevelUpLevel(newLevel);
      tg()?.HapticFeedback?.notificationOccurred("success");
      tg()?.HapticFeedback?.impactOccurred("heavy");
    }
    prevLevelRef.current = newLevel;
    setStars(newStars);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tasks`, {
        headers: { "X-Tg-Init-Data": tg()?.initData || "", "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ initData: tg()?.initData || "", telegram_id: tid }),
      });
      const data = await r.json();
      if (data.tasks) setTasks(data.tasks);
      if (typeof data.stars === "number") updateStars(data.stars);
    } finally {
      setLoading(false);
    }
  }, [tid, updateStars]);

  const loadShop = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg()?.initData || "", telegram_id: tid }),
      });
      const data = await r.json();
      if (data.items) { setShop(data.items); updateStars(data.stars); }
    } finally {
      setLoading(false);
    }
  }, [tid, updateStars]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (tab === "shop") loadShop();
  }, [tab, loadShop]);

  const completeTask = async (taskId: number) => {
    const r = await fetch(`${API}/tasks/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg()?.initData || "", telegram_id: tid, task_id: taskId }),
    });
    const data = await r.json();
    if (data.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast(`🎉 Отправлено на проверку! +${data.stars}⭐`);
      loadTasks();
    } else {
      showToast("❌ " + (data.error || "Ошибка"));
    }
  };

  const buyItem = async (rewardId: number) => {
    const r = await fetch(`${API}/shop/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg()?.initData || "", telegram_id: tid, reward_id: rewardId }),
    });
    const data = await r.json();
    if (data.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      setStars(data.new_stars);
      showToast(`🛒 Запрос отправлен родителю!`);
      loadShop();
    } else {
      showToast("❌ " + (data.error || "Ошибка"));
    }
  };

  const pending = tasks.filter(t => t.status === "pending");
  const done = tasks.filter(t => t.status === "done");
  const approved = tasks.filter(t => t.status === "approved");
  const overdue = pending.filter(t => t.is_overdue);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {levelUpLevel !== null && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl px-4 py-3 text-sm font-medium shadow-xl animate-slide-up text-center">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Привет, {user.name}! 👋</h1>
            <p className="text-white/70 text-sm mt-0.5">Выполняй задания — получай звёзды</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-yellow-300 text-2xl font-black">{stars}</p>
              <p className="text-white/80 text-xs">звёзд ⭐</p>
            </div>
            <div className="bg-white/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-white text-2xl font-black">{getLevelInfo(stars).level}</p>
              <p className="text-white/80 text-xs">{getLevelTier(getLevelInfo(stars).level).emoji} {getLevelTier(getLevelInfo(stars).level).title}</p>
            </div>
          </div>
        </div>
        <XpBar stars={stars} />
        {overdue.length > 0 && (
          <div className="mt-3 bg-red-500/30 border border-red-400/40 rounded-xl px-3 py-2">
            <p className="text-white text-sm font-medium">🔴 {overdue.length} просроченных задания</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="bg-white/15 rounded-2xl p-1 flex gap-1">
          {(["tasks", "shop"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === t ? "bg-white text-purple-700 shadow-sm" : "text-white/80"
              }`}
            >
              {t === "tasks" ? "📋 Задачи" : "🛍️ Магазин"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-8">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && tab === "tasks" && (
          <>
            {pending.length === 0 && done.length === 0 && approved.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">🌟</p>
                <p className="text-white font-semibold text-lg">Нет задач!</p>
                <p className="text-white/70 text-sm mt-1">Жди новых заданий от родителя</p>
              </div>
            ) : (
              <>
                {pending.length > 0 && (
                  <div className="mb-2">
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                      Нужно выполнить ({pending.length})
                    </p>
                    {pending.map(t => <TaskCard key={t.id} task={t} onComplete={completeTask} />)}
                  </div>
                )}
                {done.length > 0 && (
                  <div className="mb-2">
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                      Ждут подтверждения ({done.length})
                    </p>
                    {done.map(t => <TaskCard key={t.id} task={t} />)}
                  </div>
                )}
                {approved.length > 0 && (
                  <div className="mb-2">
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                      Выполнено ({approved.length})
                    </p>
                    {approved.slice(0, 5).map(t => <TaskCard key={t.id} task={t} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!loading && tab === "shop" && (
          <>
            {shop.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">🎁</p>
                <p className="text-white font-semibold text-lg">Магазин пуст</p>
                <p className="text-white/70 text-sm mt-1">Родитель ещё не добавил награды</p>
              </div>
            ) : (
              shop.map(item => (
                <div key={item.id} className={`rounded-2xl p-4 mb-3 shadow-sm border flex items-center gap-3 ${
                  item.can_buy ? "bg-white border-gray-100" : "bg-white/50 border-white/30"
                }`}>
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${item.can_buy ? "text-gray-800" : "text-gray-500"}`}>{item.title}</p>
                    <p className="text-yellow-600 font-bold text-sm">{item.cost}⭐</p>
                  </div>
                  {item.can_buy ? (
                    <button
                      onClick={() => buyItem(item.id)}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-xl px-4 py-2 text-sm active:scale-95 transition-transform"
                    >
                      Купить
                    </button>
                  ) : (
                    <div className="bg-gray-100 text-gray-400 font-bold rounded-xl px-4 py-2 text-sm">
                      🔒 Мало
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
