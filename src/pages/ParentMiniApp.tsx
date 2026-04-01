import { useState, useEffect, useCallback } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { StreakCard } from "@/components/demo/StreakCard";
import { ParentXpBar } from "@/components/demo/XpBar";
import { getParentLevelInfo, getParentLevelTier, getParentTip, PARTNER_PRIZES, PARENT_ACTION_LABELS, PARENT_ACTION_XP, getStreakBonus, type StreakState } from "@/components/demo/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ParentData = {
  role: "parent";
  id: number;
  name: string;
  telegram_id: number;
  parent_xp: number;
  parent_points: number;
  streak_current: number;
  streak_last_date: string | null;
  streak_claimed_today: boolean;
  streak_longest: number;
  children: { id: number; name: string; stars: number; avatar: string; age: number }[];
  tasks: Task[];
  gradeRequests: GradeRequest[];
  rewards: Reward[];
};

type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; childId: number; requirePhoto: boolean;
  requireConfirm: boolean; photoStatus: string;
  childName?: string;
};

type GradeRequest = {
  id: number; childId: number; childName: string;
  subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null;
};

type Reward = { id: number; title: string; cost: number; emoji: string };

type ParentTab = "tasks" | "grades" | "children" | "bonuses" | "profile";

// ─── Loading / Error screens ──────────────────────────────────────────────────

function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF]">
      <div className="text-5xl mb-4">👨</div>
      <p className="text-[#1E1B4B] font-black text-lg">Загружаем профиль...</p>
      <div className="mt-4 w-8 h-8 border-2 border-[#6B7BFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF]">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-[#1E1B4B] font-bold text-xl mb-2">Что-то пошло не так</p>
      <p className="text-gray-500 text-sm">{msg}</p>
      <p className="text-gray-400 text-xs mt-3">Зайди через @parenttask_bot</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ParentMiniApp() {
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ParentTab>("tasks");
  const [toast, setToast] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", stars: 3, emoji: "📋", childId: 0, requirePhoto: false, requireConfirm: false });

  useEffect(() => {
    const webapp = tg();
    if (webapp) { webapp.ready(); webapp.expand(); }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const webapp = tg();
    const tgId = webapp?.initDataUnsafe?.user?.id;
    const firstName = webapp?.initDataUnsafe?.user?.first_name || "";
    const res = await apiCall("parent/auth", {
      ...(tgId ? { telegram_id: tgId, first_name: firstName } : {}),
    });
    if (res.role === "parent") {
      setData(res as unknown as ParentData);
    } else if (res.role === "unknown" || res.error) {
      setError("Аккаунт не найден.\n\nОткрой @parenttask_bot в Telegram и нажми /start, затем снова открой приложение.");
    } else {
      setError(String(res.error || "Ошибка авторизации"));
    }
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    tg()?.HapticFeedback?.notificationOccurred("success");
    setTimeout(() => setToast(null), 3000);
  };

  const confirmTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, action: "approve" });
    if (res.ok) { showToast("✅ Задача подтверждена!"); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, action: "reject" });
    if (res.ok) { showToast("↩️ Задача возвращена"); load(); }
  }, []);

  const approveGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, action: "approve" });
    if (res.ok) { showToast(`🌟 Оценка подтверждена! +${res.stars_awarded}⭐`); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, action: "reject" });
    if (res.ok) { showToast("↩️ Оценка отклонена"); load(); }
  }, []);

  const addTask = useCallback(async () => {
    if (!newTask.title.trim() || !newTask.childId) return;
    const res = await apiCall("parent/task/add", { ...newTask, child_id: newTask.childId, require_photo: newTask.requirePhoto, require_confirm: newTask.requireConfirm });
    if (res.ok) { showToast("📋 Задача создана!"); setShowAddTask(false); setNewTask({ title: "", stars: 3, emoji: "📋", childId: data?.children[0]?.id ?? 0, requirePhoto: false, requireConfirm: false }); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, [newTask, data]);

  const claimStreak = useCallback(async () => {
    const res = await apiCall("parent/streak/claim");
    if (res.ok) { showToast(`🔥 +${res.xp} XP и +${res.points} баллов!`); load(); }
    else showToast(String(res.error || "Уже получено сегодня"));
  }, []);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorScreen msg={error || "Нет данных"} />;

  const streak: StreakState = {
    current: data.streak_current,
    lastActivityDate: data.streak_last_date || "",
    claimedToday: data.streak_claimed_today,
    longestStreak: data.streak_longest,
  };

  const pendingTasks = data.tasks.filter(t => t.status === "pending_confirm" || t.status === "done");
  const pendingGrades = data.gradeRequests.filter(g => g.status === "pending");
  const { level } = getParentLevelInfo(data.parent_xp);
  const tier = getParentLevelTier(level);
  const tip = getParentTip(level);

  const TASK_EMOJIS = ["📋", "🧹", "📚", "🦷", "🗑️", "📖", "🌸", "🐕", "🍽️", "🛁", "🧺", "🏃", "🎨", "🎵"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]" style={{ fontFamily: "Golos Text, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#1E1B4B] text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl text-center" style={{ animation: "slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Добро пожаловать</p>
            <h1 className="text-xl font-bold text-[#1E1B4B]">{data.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StreakCard streak={streak} onClaim={claimStreak} compact />
            <div className="w-10 h-10 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-xl shadow-md">👨</div>
          </div>
        </div>
        <ParentXpBar xp={data.parent_xp} points={data.parent_points} />
        <div className="mt-3 bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-xs font-bold text-[#6B7BFF] uppercase tracking-wide mb-0.5">Совет уровня {level}</p>
            <p className="text-sm text-gray-600">{tip}</p>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-32">

        {/* Tasks */}
        {tab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
              <button onClick={() => setShowAddTask(v => !v)} className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform">
                {showAddTask ? "✕ Закрыть" : "+ Добавить"}
              </button>
            </div>

            {/* Add task form */}
            {showAddTask && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
                  <p className="text-white font-black text-base">📋 Новая задача</p>
                </div>
                <div className="p-5 space-y-4">
                  {data.children.length > 1 && (
                    <div>
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Для кого</label>
                      <div className="flex gap-2">
                        {data.children.map(c => (
                          <button key={c.id} onClick={() => setNewTask(t => ({ ...t, childId: c.id }))}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${newTask.childId === c.id ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white" : "bg-gray-50 text-gray-600"}`}>
                            {c.avatar} {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Иконка</label>
                    <div className="flex gap-2 flex-wrap">
                      {TASK_EMOJIS.map(e => (
                        <button key={e} onClick={() => setNewTask(t => ({ ...t, emoji: e }))}
                          className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${newTask.emoji === e ? "ring-2 ring-[#6B7BFF] bg-[#6B7BFF]/10 scale-110" : "bg-gray-50"}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Название *</label>
                    <input type="text" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} placeholder="Убрать комнату"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Награда</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setNewTask(t => ({ ...t, stars: s }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${newTask.stars === s ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-105" : "bg-gray-50 text-gray-600"}`}>
                          {s}⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Toggles */}
                  {[
                    { key: "requireConfirm", icon: "✅", label: "Требовать подтверждение", desc: "Звёзды после проверки", color: "green" },
                    { key: "requirePhoto", icon: "📸", label: "Требовать фото", desc: "Приложить фотоотчёт", color: "purple" },
                  ].map(tog => {
                    const active = newTask[tog.key as "requireConfirm" | "requirePhoto"];
                    return (
                      <div key={tog.key} onClick={() => setNewTask(t => ({ ...t, [tog.key]: !t[tog.key as "requireConfirm" | "requirePhoto"] }))}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${active ? `border-${tog.color}-400 bg-${tog.color}-50` : "border-gray-200 bg-gray-50"}`}>
                        <span className="text-xl">{tog.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-black ${active ? `text-${tog.color}-700` : "text-gray-600"}`}>{tog.label}</p>
                          <p className="text-xs text-gray-400">{tog.desc}</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-all duration-300 ${active ? `bg-${tog.color}-500` : "bg-gray-300"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 mt-0.5 ${active ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={addTask} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-transform">
                    Добавить задачу
                  </button>
                </div>
              </div>
            )}

            {/* Pending confirmations */}
            {pendingTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span>⏳</span>
                  <p className="text-sm font-black text-[#1E1B4B]">Ждут подтверждения</p>
                  <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingTasks.length}</span>
                </div>
                {pendingTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden mb-3">
                    <div className="flex items-center gap-3 p-4">
                      <span className="text-2xl">{task.emoji}</span>
                      <div className="flex-1">
                        <p className="font-black text-[#1E1B4B]">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{data.children.find(c => c.id === task.childId)?.name} · {task.stars}⭐</p>
                      </div>
                    </div>
                    <div className="flex gap-2 px-4 pb-4">
                      <button onClick={() => rejectTask(task.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Вернуть</button>
                      <button onClick={() => confirmTask(task.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform">✓ Подтвердить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All tasks */}
            <div className="space-y-2">
              {data.tasks.filter(t => !["pending_confirm", "done"].includes(t.status)).map(task => (
                <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <span className="text-2xl">{task.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1E1B4B] text-sm">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {data.children.find(c => c.id === task.childId)?.name}
                      {task.requirePhoto && " · 📸"}
                      {task.requireConfirm && " · ✅"}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${task.status === "approved" ? "text-green-500" : "text-amber-500"}`}>
                    {task.status === "approved" ? "✓" : ""}{task.stars}⭐
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grades */}
        {tab === "grades" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Оценки детей</h2>
            {pendingGrades.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingGrades.length} новых</span>
                </div>
                {pendingGrades.map(g => (
                  <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
                    <div className="flex items-center gap-3 p-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${g.grade >= 4 ? "bg-green-100" : "bg-orange-100"}`}>
                        {g.grade >= 4 ? "😊" : g.grade >= 3 ? "😐" : "😔"}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-[#1E1B4B]">{g.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{g.date} · {g.childName}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xl ${g.grade >= 4 ? "text-green-600" : "text-orange-500"}`}>{g.grade}</p>
                        <p className="text-xs text-gray-400">+{g.grade}⭐</p>
                      </div>
                    </div>
                    <div className="flex gap-2 px-4 pb-4">
                      <button onClick={() => rejectGrade(g.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Отклонить</button>
                      <button onClick={() => approveGrade(g.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform">✓ Подтвердить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.gradeRequests.filter(g => g.status !== "pending").map(g => (
              <div key={g.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <span className="text-xl">{g.grade >= 4 ? "😊" : "😐"}</span>
                <div className="flex-1">
                  <p className="font-bold text-[#1E1B4B] text-sm">{g.subject} · {g.grade}</p>
                  <p className="text-xs text-gray-400">{g.childName} · {g.date}</p>
                </div>
                {g.status === "approved" ? <span className="text-xs font-bold text-green-500">+{g.starsAwarded}⭐</span> : <span className="text-xs font-bold text-red-400">Отклонено</span>}
              </div>
            ))}
            {data.gradeRequests.length === 0 && <p className="text-center text-gray-400 py-8">Нет запросов на обмен оценок</p>}
          </div>
        )}

        {/* Children */}
        {tab === "children" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
            {data.children.map(c => {
              const level = Math.floor(c.stars / 10) + 1;
              const pct = (c.stars % 10) / 10 * 100;
              return (
                <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#6B7BFF]/20 to-[#9B6BFF]/20 rounded-2xl flex items-center justify-center text-3xl">{c.avatar}</div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E1B4B] text-lg">{c.name}</p>
                      <p className="text-sm text-gray-400">{c.age} лет</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-500 font-black text-xl">{c.stars}⭐</p>
                      <p className="text-sm font-bold text-[#6B7BFF]">ур. {level}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bonuses */}
        {tab === "bonuses" && (
          <div className="space-y-4">
            <StreakCard streak={streak} onClaim={claimStreak} />
            <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-lg">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Ваш баланс</p>
              <p className="text-4xl font-black">{data.parent_points.toLocaleString()} <span className="text-2xl font-bold">баллов</span></p>
              <p className="text-white/70 text-xs mt-2">+1 000 баллов за каждый новый уровень</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg">{tier.emoji}</span>
                <span className="text-sm font-bold">{tier.badge}</span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B] mb-3">Магазин призов</h3>
              {PARTNER_PRIZES.map(prize => {
                const canBuy = data.parent_points >= prize.cost;
                return (
                  <div key={prize.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 flex items-start gap-3">
                    <span className="text-3xl">{prize.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E1B4B] text-sm">{prize.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">от {prize.partner}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-black text-amber-600">{prize.cost.toLocaleString()} б.</p>
                      <button disabled={!canBuy} className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${canBuy ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                        Обменять
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile */}
        {tab === "profile" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-6 text-center text-white shadow-lg">
              <div className="text-6xl mb-2">👨</div>
              <h2 className="text-2xl font-black">{data.name}</h2>
              <p className="opacity-80 font-bold">{tier.badge}</p>
              <div className="mt-3 bg-white/20 rounded-2xl px-4 py-2 inline-block">
                <p className="text-sm font-black">{data.parent_points.toLocaleString()} баллов</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Детей", value: data.children.length, emoji: "👨‍👧‍👦" },
                { label: "Задач создано", value: data.tasks.length, emoji: "📋" },
                { label: "Уровень", value: level, emoji: tier.emoji },
                { label: "Стрик", value: `${data.streak_current}🔥`, emoji: "📅" },
              ].map(s => (
                <div key={s.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <div className="text-2xl font-black text-[#1E1B4B]">{s.value}</div>
                  <div className="text-xs font-bold text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 py-2 flex gap-0.5 border border-white">
          {([
            { key: "tasks",    emoji: "📋", label: "Задачи",   badge: pendingTasks.length },
            { key: "grades",   emoji: "📝", label: "Оценки",   badge: pendingGrades.length },
            { key: "children", emoji: "👨‍👧", label: "Дети",     badge: 0 },
            { key: "bonuses",  emoji: "🏅", label: "Бонусы",   badge: 0 },
            { key: "profile",  emoji: "👤", label: "Профиль",  badge: 0 },
          ] as { key: ParentTab; emoji: string; label: string; badge: number }[]).map(t => (
            <button key={t.key} onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); setTab(t.key); }}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl transition-all duration-300 relative ${tab === t.key ? "bg-gradient-to-b from-[#6B7BFF] to-[#9B6BFF] scale-110 shadow-md" : "hover:bg-gray-50"}`}>
              {t.badge > 0 && tab !== t.key && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{t.badge}</span>
              )}
              <span className="text-xl">{t.emoji}</span>
              <span className={`text-[9px] font-black ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}