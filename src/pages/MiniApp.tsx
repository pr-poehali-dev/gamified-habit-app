import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/3a2e1162-786c-43ae-a6b7-78b24771e462";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: { user?: { id: number; first_name: string } };
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

const tg = () => window.Telegram?.WebApp;

type Task = {
  id: number;
  emoji: string;
  title: string;
  stars: number;
  original_stars: number;
  late_stars: number | null;
  status: "pending" | "done" | "approved";
  deadline: string | null;
  is_overdue: boolean;
  can_complete: boolean;
  created_at: string;
  completed_at: string | null;
  child_name?: string;
  child_id?: number;
};

type ShopItem = { id: number; emoji: string; title: string; cost: number; can_buy: boolean };
type ChildStat = { name: string; stars: number; done: number; total: number; overdue: number };

type User =
  | { role: "child"; id: number; name: string; stars: number; parent_id: number; telegram_id: number }
  | { role: "parent"; id: number; name: string; telegram_id: number; children: { id: number; name: string; stars: number }[] }
  | { role: "unknown"; telegram_id: number };

type Tab = "tasks" | "shop" | "stats";

function formatDeadline(iso: string | null): { label: string; color: string } | null {
  if (!iso) return null;
  const now = Date.now();
  const dl = new Date(iso).getTime();
  const diff = dl - now;
  if (diff < 0) {
    const h = Math.floor(Math.abs(diff) / 3600000);
    return { label: `просрочено ${h > 0 ? h + "ч" : ""} назад`, color: "text-red-500" };
  }
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h <= 2) return { label: `${h}ч осталось!`, color: "text-orange-500" };
  if (d >= 1) return { label: `${d}д ${h % 24}ч`, color: "text-yellow-600" };
  return { label: `${h}ч`, color: "text-yellow-600" };
}

const STARS_PER_LEVEL = 10;

function getLevelInfo(totalStars: number) {
  const level = Math.floor(totalStars / STARS_PER_LEVEL) + 1;
  const xpInLevel = totalStars % STARS_PER_LEVEL;
  const xpPct = (xpInLevel / STARS_PER_LEVEL) * 100;
  return { level, xpInLevel, xpPct };
}

function getLevelEmoji(level: number) {
  if (level >= 20) return "🏆";
  if (level >= 15) return "💎";
  if (level >= 10) return "🥇";
  if (level >= 7) return "🥈";
  if (level >= 4) return "🥉";
  return "⭐";
}

function XpBar({ stars }: { stars: number }) {
  const { level, xpInLevel, xpPct } = getLevelInfo(stars);
  const emoji = getLevelEmoji(level);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{emoji}</span>
          <span className="text-white font-bold text-sm">Уровень {level}</span>
        </div>
        <span className="text-white/70 text-xs">{xpInLevel}/10 XP до следующего</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 rounded-full transition-all duration-700"
          style={{ width: `${xpPct}%` }}
        />
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${p}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p, i) => (
          <span key={p} className={`text-[9px] ${xpPct >= p && (i === 10 || xpPct < (p + 10)) ? "text-yellow-300 font-bold" : "text-white/30"}`}>
            {i === 0 ? "" : i === 10 ? "100%" : `${p}%`}
          </span>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onComplete, onApprove, isParent }: {
  task: Task;
  onComplete?: (id: number) => void;
  onApprove?: (id: number) => void;
  isParent?: boolean;
}) {
  const dl = formatDeadline(task.deadline);
  const isPending = task.status === "pending";
  const isDone = task.status === "done";
  const isApproved = task.status === "approved";

  return (
    <div className={`rounded-2xl p-4 mb-3 shadow-sm border transition-all duration-200 ${
      isApproved ? "bg-green-50 border-green-100" :
      isDone ? "bg-blue-50 border-blue-100" :
      task.is_overdue ? "bg-red-50 border-red-200" :
      "bg-white border-gray-100"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-gray-800 leading-snug ${isApproved ? "line-through text-gray-400" : ""}`}>
              {task.title}
            </p>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-yellow-500 font-bold text-sm whitespace-nowrap">
                {task.is_overdue && task.late_stars !== null && task.late_stars !== undefined && task.late_stars < task.original_stars ? (
                  <><s className="text-gray-400">{task.original_stars}</s> → {task.stars}⭐</>
                ) : `${task.stars}⭐`}
              </span>
            </div>
          </div>

          {isParent && task.child_name && (
            <p className="text-xs text-gray-500 mt-0.5">👤 {task.child_name}</p>
          )}

          {dl && isPending && (
            <p className={`text-xs mt-1 font-medium ${dl.color}`}>
              ⏳ {dl.label}
            </p>
          )}

          {isApproved && (
            <p className="text-xs text-green-600 mt-1 font-medium">✅ Выполнено и подтверждено</p>
          )}
          {isDone && (
            <p className="text-xs text-blue-600 mt-1 font-medium">🕐 Ждёт подтверждения родителя</p>
          )}
          {isPending && task.is_overdue && !task.can_complete && (
            <p className="text-xs text-red-500 mt-1 font-medium">🚫 Срок вышел, нельзя выполнить</p>
          )}
        </div>
      </div>

      {isPending && task.can_complete && onComplete && (
        <button
          onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); onComplete(task.id); }}
          className="mt-3 w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
        >
          ✅ Выполнил!
        </button>
      )}

      {isDone && isParent && onApprove && (
        <button
          onClick={() => { tg()?.HapticFeedback?.impactOccurred("medium"); onApprove(task.id); }}
          className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
        >
          ✅ Подтвердить
        </button>
      )}
    </div>
  );
}

function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const emoji = getLevelEmoji(level);
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-8 text-center shadow-2xl w-full max-w-xs"
        style={{ animation: "levelUpPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="text-7xl mb-3" style={{ animation: "spinOnce 0.6s ease-out 0.2s both" }}>
          {emoji}
        </div>
        <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">Новый уровень!</p>
        <p className="text-white text-5xl font-black mb-2">{level}</p>
        <p className="text-white/90 text-base font-semibold">Так держать! Ты становишься лучше!</p>
        <div className="mt-5 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="text-2xl"
              style={{ animation: `starPop 0.4s ease-out ${0.4 + i * 0.08}s both` }}
            >
              ⭐
            </span>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 bg-white/30 text-white font-bold rounded-2xl px-6 py-2 text-sm active:scale-95 transition-transform"
        >
          Ура! 🎉
        </button>
      </div>
    </div>
  );
}

function ChildView({ user }: { user: Extract<User, { role: "child" }> }) {
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
    } finally {
      setLoading(false);
    }
  }, [tid]);

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
  }, [tid]);

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
              <p className="text-white/80 text-xs">уровень {getLevelEmoji(getLevelInfo(stars).level)}</p>
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

function ParentView({ user }: { user: Extract<User, { role: "parent" }> }) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<{ total_done: number; total_pending: number; awaiting: number; overdue: number; children: ChildStat[] } | null>(null);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const tid = user.telegram_id;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { initData: tg()?.initData || "", telegram_id: tid };
      if (selectedChild) body.child_id = selectedChild;
      const r = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.tasks) setTasks(data.tasks);
    } finally {
      setLoading(false);
    }
  }, [tid, selectedChild]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg()?.initData || "", telegram_id: tid }),
      });
      const data = await r.json();
      if (!data.error) setStats(data);
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    if (tab === "tasks") loadTasks();
    if (tab === "stats") loadStats();
  }, [tab, loadTasks, loadStats]);

  const approveTask = async (taskId: number) => {
    const r = await fetch(`${API}/tasks/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg()?.initData || "", telegram_id: tid, task_id: taskId }),
    });
    const data = await r.json();
    if (data.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast(`✅ Подтверждено! +${data.stars_added}⭐`);
      loadTasks();
    } else {
      showToast("❌ " + (data.error || "Ошибка"));
    }
  };

  const awaitingApproval = tasks.filter(t => t.status === "done");
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const overdueTasks = pendingTasks.filter(t => t.is_overdue);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)" }}>
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl px-4 py-3 text-sm font-medium shadow-xl animate-slide-up text-center">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-white text-xl font-bold">Родительский портал</h1>
        <p className="text-white/70 text-sm">Привет, {user.name}!</p>

        {/* Children pills */}
        {user.children.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedChild(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedChild === null ? "bg-white text-purple-800" : "bg-white/20 text-white"
              }`}
            >
              Все дети
            </button>
            {user.children.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChild(ch.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedChild === ch.id ? "bg-white text-purple-800" : "bg-white/20 text-white"
                }`}
              >
                {ch.name} · {ch.stars}⭐
              </button>
            ))}
          </div>
        )}

        {/* Alert badges */}
        <div className="flex gap-2 mt-3">
          {awaitingApproval.length > 0 && (
            <div className="bg-blue-500/40 border border-blue-400/40 rounded-xl px-3 py-1.5">
              <p className="text-white text-xs font-semibold">🕐 {awaitingApproval.length} ждут подтверждения</p>
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div className="bg-red-500/40 border border-red-400/40 rounded-xl px-3 py-1.5">
              <p className="text-white text-xs font-semibold">🔴 {overdueTasks.length} просрочено</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="bg-white/15 rounded-2xl p-1 flex gap-1">
          {([
            { key: "tasks", label: "📋 Задачи" },
            { key: "stats", label: "📊 Статистика" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === t.key ? "bg-white text-purple-900 shadow-sm" : "text-white/80"
              }`}
            >
              {t.label}
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
            {awaitingApproval.length > 0 && (
              <div className="mb-4">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                  Ждут вашего подтверждения ({awaitingApproval.length})
                </p>
                {awaitingApproval.map(t => (
                  <TaskCard key={t.id} task={t} onApprove={approveTask} isParent />
                ))}
              </div>
            )}

            {overdueTasks.length > 0 && (
              <div className="mb-4">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                  🔴 Просрочено ({overdueTasks.length})
                </p>
                {overdueTasks.map(t => <TaskCard key={t.id} task={t} isParent />)}
              </div>
            )}

            {pendingTasks.filter(t => !t.is_overdue).length > 0 && (
              <div className="mb-4">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                  В работе ({pendingTasks.filter(t => !t.is_overdue).length})
                </p>
                {pendingTasks.filter(t => !t.is_overdue).map(t => <TaskCard key={t.id} task={t} isParent />)}
              </div>
            )}

            {tasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">📋</p>
                <p className="text-white font-semibold text-lg">Нет задач</p>
                <p className="text-white/70 text-sm mt-1">Добавьте задачи через Telegram-бота</p>
              </div>
            )}
          </>
        )}

        {!loading && tab === "stats" && stats && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Выполнено", value: stats.total_done, icon: "✅", color: "from-green-400 to-emerald-500" },
                { label: "В работе", value: stats.total_pending, icon: "◻️", color: "from-blue-400 to-indigo-500" },
                { label: "На проверке", value: stats.awaiting, icon: "🕐", color: "from-orange-400 to-amber-500" },
                { label: "Просрочено", value: stats.overdue, icon: "🔴", color: "from-red-400 to-rose-500" },
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 shadow-sm`}>
                  <p className="text-white/80 text-xs">{card.icon} {card.label}</p>
                  <p className="text-white text-3xl font-black mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Children breakdown */}
            {stats.children.map(ch => {
              const pct = ch.total > 0 ? Math.round(ch.done / ch.total * 100) : 0;
              return (
                <div key={ch.name} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.done} из {ch.total} задач</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-500 font-black text-xl">{ch.stars}⭐</p>
                      {ch.overdue > 0 && (
                        <p className="text-red-500 text-xs font-semibold">🔴 {ch.overdue} просроч.</p>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{pct}% выполнено</p>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

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