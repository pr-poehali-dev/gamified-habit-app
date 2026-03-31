import { useState, useEffect, useCallback } from "react";
import { API, tg } from "./types";
import type { Task, ChildStat, User, Tab } from "./types";
import { TaskCard } from "./XpBar";

export default function ParentView({ user }: { user: Extract<User, { role: "parent" }> }) {
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
